const express = require('express');
const DependencyContainer = require('../../infrastructure/config/DependencyContainer');

// Domain Contracts
const UserRepository = require('../../core/domain/shared/contracts/Repository');
const SessionRepository = require('../../core/domain/user/contracts/SessionRepository');
const UserRepositoryContract = require('../../core/domain/user/contracts/UserRepository');
const OtpService = require('../../core/domain/user/contracts/OtpService');
const PasswordService = require('../../core/domain/user/contracts/PasswordService');
const PhoneService = require('../../core/domain/user/contracts/PhoneService');
const JwtService = require('../../core/domain/user/contracts/JwtService');

// Infrastructure Adapters
const UserMySQLAdapter = require('./infrastructure/persistence/UserMySQLAdapter');
const SessionMySQLAdapter = require('./infrastructure/persistence/SessionMySQLAdapter');
const MockOtpAdapter = require('../../infrastructure/adapters/external/MockOtpAdapter');

// Infrastructure Services
const PasswordServiceImpl = require('../../infrastructure/services/PasswordServiceImpl');
const PhoneServiceImpl = require('../../infrastructure/services/PhoneServiceImpl');
const JwtServiceImpl = require('../../infrastructure/services/JwtServiceImpl');

// Application Services
const AuthenticationApplicationService = require('../../core/application/user/services/AuthenticationApplicationService');
const UserApplicationService = require('../../core/application/user/services/UserApplicationService');

// Controllers
const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const SessionController = require('./controllers/SessionController');
const SettingsController = require('./controllers/SettingsController');

// Middleware
const AuthenticationMiddleware = require('./middleware/AuthenticationMiddleware');
const ValidationMiddleware = require('./middleware/ValidationMiddleware');

// Database Setup
const userDatabaseSetup = require('./infrastructure/persistence/models');

/**
 * User Module Bootstrap
 * Self-contained bootstrap for the User bounded context
 */
class UserModuleBootstrap {
  constructor() {
    this.name = 'UserModule';
    this.container = new DependencyContainer();
    this.router = express.Router();
    this.isInitialized = false;
    this.database = null;
    this.controllers = {};
    this.middleware = {};
  }

  /**
   * Initialize the User Module
   */
  async initialize(globalContainer) {
    if (this.isInitialized) {
      return this;
    }

    try {
      console.log('Initializing User Module...');

      // Initialize database
      await this._initializeDatabase();

      // Register contracts
      this._registerContracts();

      // Configure dependencies
      await this._configureDependencies(globalContainer);

      // Initialize controllers and middleware
      await this._initializeControllers();
      await this._initializeMiddleware();

      // Setup routes
      await this._setupRoutes();

      this.isInitialized = true;

      console.log('User Module initialized successfully');
      return this;

    } catch (error) {
      console.error('User Module initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get module router
   */
  getRouter() {
    if (!this.isInitialized) {
      throw new Error('User Module not initialized');
    }

    return this.router;
  }

  /**
   * Get module health status
   */
  async getHealthStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' };
    }

    try {
      // Test database connection
      const dbHealth = await this.database.testConnection();

      // Test application services
      const authService = await this.container.resolve('authenticationApplicationService');
      const userService = await this.container.resolve('userApplicationService');

      return {
        status: dbHealth ? 'healthy' : 'unhealthy',
        database: dbHealth,
        initialized: this.isInitialized,
        services: {
          authentication: !!authService,
          userManagement: !!userService
        },
        capabilities: {
          authentication: true,
          userRegistration: true,
          userProfiles: true,
          sessionManagement: true,
          passwordManagement: true,
          userSettings: true,
          otpVerification: true
        }
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Shutdown module
   */
  async shutdown() {
    console.log('Shutting down User Module...');
    
    try {
      if (this.database) {
        await this.database.shutdown();
      }
      
      this.container.clear();
      this.isInitialized = false;
      
      console.log('User Module shut down successfully');
    } catch (error) {
      console.error('Error during User Module shutdown:', error);
      throw error;
    }
  }

  // Private initialization methods
  async _initializeDatabase() {
    this.database = await userDatabaseSetup.initialize();
    console.log('User Module database initialized');
  }

  _registerContracts() {
    this.container
      .registerContract('UserRepository', UserRepositoryContract)
      .registerContract('SessionRepository', SessionRepository)
      .registerContract('OtpService', OtpService)
      .registerContract('PasswordService', PasswordService)
      .registerContract('PhoneService', PhoneService)
      .registerContract('JwtService', JwtService);
  }

  async _configureDependencies(globalContainer) {
    // Register database components
    this.container
      .registerInstance('userSequelize', this.database.sequelize)
      .registerInstance('userModels', this.database.models);

    // Register adapters
    this.container
      .registerSingleton('userRepository', async (container) => {
        const sequelize = await container.resolve('userSequelize');
        const models = await container.resolve('userModels');
        const encryptionService = await globalContainer.resolve('encryptionService');
        return new UserMySQLAdapter(sequelize, models, encryptionService);
      }, 'UserRepository')

      .registerSingleton('sessionRepository', async (container) => {
        const sequelize = await container.resolve('userSequelize');
        const models = await container.resolve('userModels');
        const encryptionService = await globalContainer.resolve('encryptionService');
        return new SessionMySQLAdapter(sequelize, models, encryptionService);
      }, 'SessionRepository')

      .registerSingleton('otpService', async (container) => {
        const config = await globalContainer.resolve('config');
        const cacheService = await globalContainer.resolve('cacheService');
        return new MockOtpAdapter(config, cacheService);
      }, 'OtpService');

    // Register services
    this.container
      .registerSingleton('passwordService', async (container) => {
        const config = await globalContainer.resolve('config');
        return new PasswordServiceImpl(config);
      }, 'PasswordService')

      .registerSingleton('phoneService', async (container) => {
        const config = await globalContainer.resolve('config');
        return new PhoneServiceImpl(config);
      }, 'PhoneService')

      .registerSingleton('jwtService', async (container) => {
        const config = await globalContainer.resolve('config');
        const encryptionService = await globalContainer.resolve('encryptionService');
        return new JwtServiceImpl(config, encryptionService);
      }, 'JwtService');

    // Register application services
    this.container
      .registerSingleton('authenticationApplicationService', async (container) => {
        return new AuthenticationApplicationService({
          userRepository: await container.resolve('userRepository'),
          sessionRepository: await container.resolve('sessionRepository'),
          encryptionService: await globalContainer.resolve('encryptionService'),
          cacheService: await globalContainer.resolve('cacheService'),
          eventPublisher: await globalContainer.resolve('eventPublisher'),
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
          encryptionService: await globalContainer.resolve('encryptionService'),
          cacheService: await globalContainer.resolve('cacheService'),
          eventPublisher: await globalContainer.resolve('eventPublisher'),
          passwordService: await container.resolve('passwordService'),
          phoneService: await container.resolve('phoneService')
        });
      });
  }

  async _initializeControllers() {
    this.controllers.auth = new AuthController(
      await this.container.resolve('authenticationApplicationService')
    );

    this.controllers.user = new UserController(
      await this.container.resolve('userApplicationService')
    );

    this.controllers.session = new SessionController(
      await this.container.resolve('authenticationApplicationService')
    );

    this.controllers.settings = new SettingsController(
      await this.container.resolve('userApplicationService')
    );
  }

  async _initializeMiddleware() {
    this.middleware.authentication = new AuthenticationMiddleware(
      await this.container.resolve('jwtService'),
      await this.container.resolve('authenticationApplicationService')
    );

    this.middleware.validation = new ValidationMiddleware();
  }

  async _setupRoutes() {
    // Health check
    this.router.get('/user/health', async (req, res) => {
      const health = await this.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
        message: `User module is ${health.status}`
      });
    });

    // Authentication routes (public)
    this.router.post('/auth/register/request-otp', 
      this.middleware.validation.validateRegistrationOtpRequest(),
      this.controllers.auth.requestRegistrationOtp.bind(this.controllers.auth)
    );

    this.router.post('/auth/register', 
      this.middleware.validation.validateRegistration(),
      this.controllers.auth.register.bind(this.controllers.auth)
    );

    this.router.post('/auth/login/request-otp', 
      this.middleware.validation.validateLoginOtpRequest(),
      this.controllers.auth.requestLoginOtp.bind(this.controllers.auth)
    );

    this.router.post('/auth/login', 
      this.middleware.validation.validateLogin(),
      this.controllers.auth.login.bind(this.controllers.auth)
    );

    this.router.post('/auth/refresh', 
      this.middleware.validation.validateRefreshToken(),
      this.controllers.auth.refreshToken.bind(this.controllers.auth)
    );

    this.router.post('/auth/logout', 
      this.middleware.authentication.authenticate(),
      this.controllers.auth.logout.bind(this.controllers.auth)
    );

    // Password reset routes (public)
    this.router.post('/auth/password/reset/request-otp', 
      this.middleware.validation.validatePasswordResetOtpRequest(),
      this.controllers.auth.requestPasswordResetOtp.bind(this.controllers.auth)
    );

    this.router.post('/auth/password/reset/verify-otp', 
      this.middleware.validation.validatePasswordResetOtpVerification(),
      this.controllers.auth.verifyResetOtp.bind(this.controllers.auth)
    );

    this.router.post('/auth/password/reset', 
      this.middleware.validation.validatePasswordReset(),
      this.controllers.auth.resetPassword.bind(this.controllers.auth)
    );

    // User profile routes (authenticated)
    this.router.get('/users/me', 
      this.middleware.authentication.authenticate(),
      this.controllers.user.getMyProfile.bind(this.controllers.user)
    );

    this.router.get('/users/:userId', 
      this.middleware.authentication.authenticate(),
      this.controllers.user.getUserProfile.bind(this.controllers.user)
    );

    this.router.put('/users/me', 
      this.middleware.authentication.authenticate(),
      this.middleware.validation.validateProfileUpdate(),
      this.controllers.user.updateProfile.bind(this.controllers.user)
    );

    this.router.post('/users/me/change-password', 
      this.middleware.authentication.authenticate(),
      this.middleware.validation.validatePasswordChange(),
      this.controllers.user.changePassword.bind(this.controllers.user)
    );

    this.router.post('/users/me/deactivate', 
      this.middleware.authentication.authenticate(),
      this.middleware.validation.validateAccountDeactivation(),
      this.controllers.user.deactivateAccount.bind(this.controllers.user)
    );

    this.router.post('/users/me/delete', 
      this.middleware.authentication.authenticate(),
      this.middleware.validation.validateAccountDeletion(),
      this.controllers.user.scheduleAccountDeletion.bind(this.controllers.user)
    );

    // Session management routes (authenticated)
    this.router.get('/sessions', 
      this.middleware.authentication.authenticate(),
      this.controllers.session.getMySessions.bind(this.controllers.session)
    );

    this.router.delete('/sessions/:sessionId', 
      this.middleware.authentication.authenticate(),
      this.controllers.session.revokeSession.bind(this.controllers.session)
    );

    this.router.delete('/sessions', 
      this.middleware.authentication.authenticate(),
      this.controllers.session.revokeAllSessions.bind(this.controllers.session)
    );

    // Settings routes (authenticated)
    this.router.get('/settings', 
      this.middleware.authentication.authenticate(),
      this.controllers.settings.getSettings.bind(this.controllers.settings)
    );

    this.router.put('/settings', 
      this.middleware.authentication.authenticate(),
      this.middleware.validation.validateSettingsUpdate(),
      this.controllers.settings.updateSettings.bind(this.controllers.settings)
    );

    // Admin routes (authenticated + admin role)
    this.router.get('/admin/users', 
      this.middleware.authentication.authenticate(['admin']),
      this.controllers.user.searchUsers.bind(this.controllers.user)
    );

    this.router.get('/admin/users/stats', 
      this.middleware.authentication.authenticate(['admin']),
      this.controllers.user.getUserStatistics.bind(this.controllers.user)
    );

    this.router.post('/admin/users/:userId/suspend', 
      this.middleware.authentication.authenticate(['admin']),
      this.middleware.validation.validateUserSuspension(),
      this.controllers.user.suspendUser.bind(this.controllers.user)
    );

    this.router.post('/admin/users/:userId/verify', 
      this.middleware.authentication.authenticate(['admin']),
      this.middleware.validation.validateUserVerification(),
      this.controllers.user.verifyUser.bind(this.controllers.user)
    );
  }
}

module.exports = UserModuleBootstrap;