const OtpService = require('../../../core/domain/user/contracts/OtpService');

/**
 * Mock OTP Adapter
 * Implements OtpService contract with mock SMS/OTP functionality for development
 */
class MockOtpAdapter extends OtpService {
  constructor(config, cacheService) {
    super();
    this.config = config;
    this.cacheService = cacheService;
    this.otpLength = config.otp?.length || 6;
    this.otpExpiry = config.otp?.expiry || 300; // 5 minutes
    this.maxAttempts = config.otp?.maxAttempts || 3;
    this.rateLimitWindow = config.otp?.rateLimitWindow || 3600; // 1 hour
    this.maxOtpPerHour = config.otp?.maxOtpPerHour || 5;
    
    // Mock configuration
    this.mockMode = config.otp?.mockMode !== false; // Default to true for development
    this.mockOtpCode = config.otp?.mockOtpCode || '123456';
    this.mockDelay = config.otp?.mockDelay || 1000; // 1 second delay to simulate real SMS
  }

  async sendOtp(phone, countryCode, type, userId = null) {
    try {
      // Check rate limits
      await this._checkRateLimit(phone, type);

      // Generate verification ID and OTP
      const verificationId = this._generateVerificationId();
      const otpCode = this.mockMode ? this.mockOtpCode : this._generateOtpCode();

      // Store OTP data
      const otpData = {
        phone,
        countryCode,
        type,
        userId,
        otpCode,
        attempts: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.otpExpiry * 1000)
      };

      await this.cacheService.set(
        `otp:${verificationId}`, 
        otpData, 
        this.otpExpiry
      );

      // Increment rate limit counter
      await this._incrementRateLimit(phone, type);

      // Mock SMS sending
      if (this.mockMode) {
        await this._mockSendSms(phone, otpCode, type);
      } else {
        // In production, integrate with real SMS service
        await this._sendRealSms(phone, otpCode, type);
      }

      console.log(`OTP sent: ${type}`, {
        verificationId,
        phone: this._maskPhone(phone),
        type,
        userId,
        mockMode: this.mockMode
      });

      return {
        verificationId,
        expiresIn: this.otpExpiry,
        message: 'OTP sent successfully'
      };

    } catch (error) {
      console.error('Failed to send OTP:', error);
      throw error;
    }
  }

  async verifyOtp(verificationId, otpCode, phoneHash) {
    try {
      // Get OTP data
      const otpData = await this.cacheService.get(`otp:${verificationId}`);
      
      if (!otpData) {
        throw new Error('Invalid or expired verification ID');
      }

      // Check expiration
      if (new Date() > new Date(otpData.expiresAt)) {
        await this.cacheService.delete(`otp:${verificationId}`);
        throw new Error('OTP has expired');
      }

      // Check attempts
      if (otpData.attempts >= this.maxAttempts) {
        await this.cacheService.delete(`otp:${verificationId}`);
        throw new Error('Maximum verification attempts exceeded');
      }

      // Verify OTP code
      if (otpData.otpCode !== otpCode) {
        // Increment attempts
        otpData.attempts += 1;
        await this.cacheService.set(
          `otp:${verificationId}`, 
          otpData, 
          Math.floor((new Date(otpData.expiresAt) - new Date()) / 1000)
        );
        
        throw new Error('Invalid OTP code');
      }

      // Verify phone hash matches (security check)
      const expectedPhoneHash = this._hashPhone(otpData.phone);
      if (expectedPhoneHash !== phoneHash) {
        throw new Error('Phone number mismatch');
      }

      // Clean up OTP data
      await this.cacheService.delete(`otp:${verificationId}`);

      console.log('OTP verified successfully', {
        verificationId,
        type: otpData.type,
        userId: otpData.userId
      });

      return true;

    } catch (error) {
      console.error('OTP verification failed:', error);
      throw error;
    }
  }

  async checkRateLimit(phone, type) {
    return await this._checkRateLimit(phone, type);
  }

  async cleanupExpired() {
    // In a real implementation, this would clean up expired OTPs from storage
    // For cache-based storage, expired items are automatically cleaned up
    console.log('OTP cleanup completed (cache handles expiration automatically)');
    return 0;
  }

  // Private helper methods
  async _checkRateLimit(phone, type) {
    const rateLimitKey = `otp_rate_limit:${phone}:${type}`;
    const currentCount = await this.cacheService.get(rateLimitKey) || 0;

    if (currentCount >= this.maxOtpPerHour) {
      throw new Error('Rate limit exceeded. Too many OTP requests.');
    }

    return true;
  }

  async _incrementRateLimit(phone, type) {
    const rateLimitKey = `otp_rate_limit:${phone}:${type}`;
    const currentCount = await this.cacheService.get(rateLimitKey) || 0;
    
    await this.cacheService.set(
      rateLimitKey, 
      currentCount + 1, 
      this.rateLimitWindow
    );
  }

  _generateVerificationId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `verify_${timestamp}_${random}`;
  }

  _generateOtpCode() {
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min).toString();
  }

  _hashPhone(phone) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(phone).digest('hex');
  }

  _maskPhone(phone) {
    if (phone.length <= 4) return phone;
    return phone.substring(0, 3) + '*'.repeat(phone.length - 6) + phone.substring(phone.length - 3);
  }

  async _mockSendSms(phone, otpCode, type) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));

    const messages = {
      registration: `Welcome to Lianxin! Your verification code is: ${otpCode}. Valid for 5 minutes.`,
      login: `Your Lianxin login code is: ${otpCode}. Valid for 5 minutes.`,
      password_reset: `Your Lianxin password reset code is: ${otpCode}. Valid for 5 minutes.`
    };

    const message = messages[type] || `Your verification code is: ${otpCode}`;

    console.log('📱 Mock SMS sent:', {
      to: this._maskPhone(phone),
      message,
      type,
      timestamp: new Date().toISOString()
    });

    // In development, you might want to log the actual OTP for testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔐 Development OTP for ${this._maskPhone(phone)}: ${otpCode}`);
    }
  }

  async _sendRealSms(phone, otpCode, type) {
    // Integrate with real SMS service (Twilio, AWS SNS, etc.)
    // This is where you would implement actual SMS sending
    throw new Error('Real SMS service not implemented. Use mock mode for development.');
  }

  // Additional utility methods for testing and monitoring
  async getOtpStats() {
    // This would return statistics about OTP usage
    return {
      totalSent: 0, // Would track in production
      totalVerified: 0,
      successRate: 0,
      averageVerificationTime: 0
    };
  }

  async getActiveOtps() {
    // For debugging - get all active OTPs (be careful with this in production)
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('This method is only available in development mode');
    }

    // Implementation would depend on cache service capabilities
    return [];
  }
}

module.exports = MockOtpAdapter;