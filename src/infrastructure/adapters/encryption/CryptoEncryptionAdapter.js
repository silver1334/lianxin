const crypto = require('crypto');
const EncryptionService = require('../../../core/domain/shared/contracts/EncryptionService');

/**
 * Crypto Encryption Adapter
 * Implements EncryptionService contract using Node.js crypto module
 */
class CryptoEncryptionAdapter extends EncryptionService {
  constructor(config) {
    super();
    this.algorithm = config.encryption?.algorithm || 'aes-256-gcm';
    this.keyDerivationAlgorithm = config.encryption?.keyDerivation || 'pbkdf2';
    this.hashAlgorithm = config.encryption?.hashAlgorithm || 'sha256';
    this.iterations = config.encryption?.iterations || 100000;
    this.keyLength = config.encryption?.keyLength || 32;
    this.ivLength = config.encryption?.ivLength || 16;
    this.saltLength = config.encryption?.saltLength || 32;
    this.tagLength = config.encryption?.tagLength || 16;
    
    // Master keys (in production, these should come from secure key management)
    this.masterKey = config.encryption?.masterKey || process.env.ENCRYPTION_MASTER_KEY || 'default-master-key-change-in-production';
    this.hmacSecret = config.encryption?.hmacSecret || process.env.HMAC_SECRET || 'default-hmac-secret-change-in-production';
    
    // Key versioning
    this.keyVersions = {
      primary: this.masterKey,
      // Add more key versions for key rotation
    };
  }

  async encrypt(data, keyVersion = 'primary') {
    try {
      if (!data) return data;

      const masterKey = this.keyVersions[keyVersion];
      if (!masterKey) {
        throw new Error(`Key version '${keyVersion}' not found`);
      }

      // Generate random salt and IV
      const salt = crypto.randomBytes(this.saltLength);
      const iv = crypto.randomBytes(this.ivLength);

      // Derive key from master key and salt
      const key = crypto.pbkdf2Sync(masterKey, salt, this.iterations, this.keyLength, this.hashAlgorithm);

      // Create cipher
      const cipher = crypto.createCipher(this.algorithm, key);
      cipher.setAAD(Buffer.from(keyVersion)); // Additional authenticated data

      // Encrypt data
      let encrypted = cipher.update(data, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      // Get authentication tag
      const tag = cipher.getAuthTag();

      // Combine all components
      const result = Buffer.concat([
        Buffer.from(keyVersion + ':', 'utf8'), // Key version prefix
        salt,
        iv,
        tag,
        encrypted
      ]);

      return result.toString('base64');

    } catch (error) {
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  async decrypt(encryptedData) {
    try {
      if (!encryptedData) return encryptedData;

      // Decode from base64
      const buffer = Buffer.from(encryptedData, 'base64');

      // Extract key version
      const versionEnd = buffer.indexOf(':');
      if (versionEnd === -1) {
        throw new Error('Invalid encrypted data format');
      }

      const keyVersion = buffer.slice(0, versionEnd).toString('utf8');
      const masterKey = this.keyVersions[keyVersion];
      if (!masterKey) {
        throw new Error(`Key version '${keyVersion}' not found`);
      }

      // Extract components
      let offset = versionEnd + 1;
      const salt = buffer.slice(offset, offset + this.saltLength);
      offset += this.saltLength;
      
      const iv = buffer.slice(offset, offset + this.ivLength);
      offset += this.ivLength;
      
      const tag = buffer.slice(offset, offset + this.tagLength);
      offset += this.tagLength;
      
      const encrypted = buffer.slice(offset);

      // Derive key
      const key = crypto.pbkdf2Sync(masterKey, salt, this.iterations, this.keyLength, this.hashAlgorithm);

      // Create decipher
      const decipher = crypto.createDecipher(this.algorithm, key);
      decipher.setAuthTag(tag);
      decipher.setAAD(Buffer.from(keyVersion));

      // Decrypt data
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');

    } catch (error) {
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  hash(data, algorithm = null) {
    const hashAlg = algorithm || this.hashAlgorithm;
    return crypto.createHash(hashAlg).update(data).digest('hex');
  }

  generateHMAC(data, secret = null) {
    const hmacSecret = secret || this.hmacSecret;
    return crypto.createHmac(this.hashAlgorithm, hmacSecret).update(data).digest('hex');
  }

  verifyHMAC(data, hmac, secret = null) {
    const expectedHmac = this.generateHMAC(data, secret);
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expectedHmac, 'hex'));
  }

  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  async encryptUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      return userData;
    }

    const sensitiveFields = [
      'phone', 'email', 'first_name', 'last_name', 'display_name',
      'bio', 'hometown', 'lives_in', 'occupation'
    ];

    const encrypted = { ...userData };

    for (const field of sensitiveFields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        encrypted[field] = await this.encrypt(encrypted[field]);
      }
    }

    return encrypted;
  }

  async decryptUserData(encryptedUserData) {
    if (!encryptedUserData || typeof encryptedUserData !== 'object') {
      return encryptedUserData;
    }

    const sensitiveFields = [
      'phone', 'email', 'first_name', 'last_name', 'display_name',
      'bio', 'hometown', 'lives_in', 'occupation'
    ];

    const decrypted = { ...encryptedUserData };

    for (const field of sensitiveFields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          decrypted[field] = await this.decrypt(decrypted[field]);
        } catch (error) {
          // If decryption fails, assume data is not encrypted
          console.warn(`Failed to decrypt field '${field}':`, error.message);
        }
      }
    }

    return decrypted;
  }

  // Key rotation methods
  rotateKey(newKeyVersion, newMasterKey) {
    this.keyVersions[newKeyVersion] = newMasterKey;
  }

  async reencryptWithNewKey(encryptedData, newKeyVersion) {
    const decrypted = await this.decrypt(encryptedData);
    return await this.encrypt(decrypted, newKeyVersion);
  }

  // Utility methods for password hashing (different from general encryption)
  hashPassword(password, salt = null) {
    const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, passwordSalt, this.iterations, 64, this.hashAlgorithm);
    return {
      hash: hash.toString('hex'),
      salt: passwordSalt
    };
  }

  verifyPassword(password, hash, salt) {
    const verifyHash = crypto.pbkdf2Sync(password, salt, this.iterations, 64, this.hashAlgorithm);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), verifyHash);
  }
}

module.exports = CryptoEncryptionAdapter;