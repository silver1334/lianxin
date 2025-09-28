const DependencyContainer = require('./DependencyContainer');
const ModuleRegistry = require('./ModuleRegistry');

// Contracts
const Repository = require('../../core/domain/shared/contracts/Repository');
const CacheService = require('../../core/domain/shared/contracts/CacheService');
const EncryptionService = require('../../core/domain/shared/contracts/EncryptionService');
const EventPublisher = require('../../core/domain/shared/contracts/EventPublisher');
const ModuleContract = require('../../core/domain/shared/contracts/ModuleContract');

// User Contracts
const UserRepository = require('../../core/domain/user/contracts/UserRepository');
const SessionRepository = require('../../core/domain/user/contracts/SessionRepository');
const OtpService = require('../../core/domain/user/contracts/OtpService');
const PasswordService = require('../../core/domain/user/contracts/PasswordService');
const PhoneService = require('../../core/domain/user/contracts/PhoneService');
const JwtService = require('../../core/domain/user/contracts/JwtService');

// Modules
const UserModule = require('../../modules/user/UserModule');
const MediaModule = require('../../modules/media/MediaModule');
const LocationModule = require('../../modules/location/LocationModule');
const PlaceModule = require('../../modules/place/PlaceModule');

// Adapters
const RedisCacheAdapter = require('../adapters/cache/RedisCacheAdapter');
const CryptoEncryptionAdapter = require('../adapters/encryption/CryptoEncryptionAdapter');
const InMemoryEventAdapter = require('../adapters/events/InMemoryEventAdapter');
const UserMySQLAdapter = require('../adapters/persistence/UserMySQLAdapter');
const SessionMySQLAdapter = require('../adapters/persistence/SessionMySQLAdapter');
const MockOtpAdapter = require('../adapters/external/MockOtpAdapter');

// Services
const PasswordServiceImpl = require('../services/PasswordServiceImpl');
const PhoneServiceImpl = require('../services/PhoneServiceImpl');
const JwtServiceImpl = require('../services/JwtServiceImpl');

// Application Services
const AuthenticationApplicationService = require('../../core/application/user/services/AuthenticationApplicationService');
const UserApplicationService = require('../../core/application/user/services/UserApplicationService');

/**
 * Application Bootstrap
 * Sets up dependency injection and module registration using Hexagonal Architecture
 */
class Bootstrap {
  constructor() {
    this.container = new DependencyContainer();
    this.moduleRegistry = new ModuleRegistry();
    this.isInitialized = false;
  }

  /**
   * Initialize the entire application
   */
  async initialize(config, database, redisClient) {
    try {
      console.log('Bootstrapping Hexagonal Architecture...');

      // Register contracts first
      this._registerContracts();

      // Configure dependencies
      await this._configureDependencies(config, database, redisClient);

      // Register modules
      this._registerModules();

      // Initialize all modules
      await this.moduleRegistry.initializeAll(this.container);

      // Validate all contracts
      await this.container.validateContracts();

      this.isInitialized = true;

      console.log('Hexagonal Architecture bootstrap completed successfully');

      return {
        container: this.container,
        moduleRegistry: this.moduleRegistry
      };

    } catch (error) {
      console.error('Hexagonal Architecture bootstrap failed:', error);
      throw error;
    }
  }

  /**
   * Register all contracts
   */
  _registerContracts() {
    // Shared contracts
    this.container
      .registerContract('Repository', Repository)
      .registerContract('CacheService', CacheService)
      .registerContract('EncryptionService', EncryptionService)
      .registerContract('EventPublisher', EventPublisher)
      .registerContract('ModuleContract', ModuleContract);

    // User domain contracts
    this.container
      .registerContract('UserRepository', UserRepository)
      .registerContract('SessionRepository', SessionRepository)
      .registerContract('OtpService', OtpService)
      .registerContract('PasswordService', PasswordService)
      .registerContract('PhoneService', PhoneService)
      .registerContract('JwtService', JwtService);

    // Module contracts
    this.moduleRegistry
      .registerModuleContract('ModuleContract', ModuleContract);
  }

  /**
   * Configure all dependencies
   */
  async _configureDependencies(config, database, redisClient) {
    // Register core infrastructure
    this.container
      .registerInstance('config', config)
      .registerInstance('database', database)
      .registerInstance('redisClient', redisClient);

    // Register adapters
    this.container
      .registerSingleton('cacheService', async (container) => {
        const redis = await container.resolve('redisClient');
        const config = await container.resolve('config');
        return new RedisCacheAdapter(redis, config);
      }, 'CacheService')

      .registerSingleton('encryptionService', async (container) => {
        const config = await container.resolve('config');
        return new CryptoEncryptionAdapter(config);
      }, 'EncryptionService')

      .registerSingleton('eventPublisher', async (container) => {
        return new InMemoryEventAdapter();
      }, 'EventPublisher')

      .registerSingleton('userRepository', async (container) => {
        const database = await container.resolve('database');
        const encryptionService = await container.resolve('encryptionService');
        return new UserMySQLAdapter(database.sequelize, database, encryptionService);
      }, 'UserRepository')

      .registerSingleton('sessionRepository', async (container) => {
        const database = await container.resolve('database');
        const encryptionService = await container.resolve('encryptionService');
        return new SessionMySQLAdapter(database.sequelize, database, encryptionService);
      }, 'SessionRepository')

      .registerSingleton('otpService', async (container) => {
        const config = await container.resolve('config');
        const cacheService = await container.resolve('cacheService');
        return new MockOtpAdapter(config, cacheService);
      }, 'OtpService');

    // Register services
    this.container
      .registerSingleton('passwordService', async (container) => {
        const config = await container.resolve('config');
        return new PasswordServiceImpl(config);
      }, 'PasswordService')

      .registerSingleton('phoneService', async (container) => {
        const config = await container.resolve('config');
        return new PhoneServiceImpl(config);
      }, 'PhoneService')

      .registerSingleton('jwtService', async (container) => {
        const config = await container.resolve('config');
        const encryptionService = await container.resolve('encryptionService');
        return new JwtServiceImpl(config, encryptionService);
      }, 'JwtService');

    // Register application services
    this.container
      .registerSingleton('authenticationApplicationService', async (container) => {
        return new AuthenticationApplicationService({
          userRepository: await container.resolve('userRepository'),
          sessionRepository: await container.resolve('sessionRepository'),
          encryptionService: await container.resolve('encryptionService'),
          cacheService: await container.resolve('cacheService'),
          eventPublisher: await container.resolve('eventPublisher'),
          otpService: await container.resolve('otpService'),
          passwordService: await container.resolve('passwordService'),
          phoneService: await container.resolve('phoneService'),
          jwtService: await container.resolve('jwtService')
        });
      })

      .registerSingleton('userApplicationService', async (container) => {
        return new UserApplicationService({
          userRepository: await container.resolve('userRepository'),
          sessionRepository: await container.resolve('sessionRepository'),
          encryptionService: await container.resolve('encryptionService'),
          cacheService: await container.resolve('cacheService'),
          eventPublisher: await container.resolve('eventPublisher'),
          passwordService: await container.resolve('passwordService'),
          phoneService: await container.resolve('phoneService')
        });
      });
  }

  /**
   * Register all modules
   */
  _registerModules() {
    this.moduleRegistry
      .register('user', UserModule, [
        'config',
        'authenticationApplicationService',
        'userApplicationService',
        'jwtService'
      ], 'ModuleContract')

      .register('media', MediaModule, [
        'config',
        'cacheService'
      ], 'ModuleContract')

      .register('location', LocationModule, [
        'config',
        'cacheService'
      ], 'ModuleContract')

      .register('place', PlaceModule, [
        'config',
        'database',
        'cacheService'
      ], 'ModuleContract');
  }

  /**
   * Get application health
   */
  async getHealth() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'unhealthy',
          error: 'Application not initialized',
          modules: {},
          dependencies: {}
        };
      }

      const moduleHealth = await this.moduleRegistry.getAllModulesHealth();
      
      const overallHealthy = Object.values(moduleHealth).every(
        health => health.status === 'healthy'
      );

      return {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        modules: moduleHealth,
        dependencies: this.container.getDependencyInfo(),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Shutdown application
   */
  async shutdown() {
    console.log('Shutting down Hexagonal Architecture...');
    
    try {
      if (this.moduleRegistry) {
        await this.moduleRegistry.shutdownAll();
      }
      
      if (this.container) {
        this.container.clear();
      }
      
      this.isInitialized = false;
      console.log('Hexagonal Architecture shutdown completed');
    } catch (error) {
      console.error('Error during shutdown:', error);
      throw error;
    }
  }
}

module.exports = Bootstrap;