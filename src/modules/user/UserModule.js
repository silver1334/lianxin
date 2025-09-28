const express = require('express');
const ModuleContract = require('../../core/domain/shared/contracts/ModuleContract');

// Controllers
const AuthController = require('./controllers/AuthController');
const UserController = require('./controllers/UserController');
const SessionController = require('./controllers/SessionController');
const SettingsController = require('./controllers/SettingsController');

// Middleware
const AuthenticationMiddleware = require('./middleware/AuthenticationMiddleware');
const ValidationMiddleware = require('./middleware/ValidationMiddleware');

/**
 * User Module
 * Bounded Context for User Management using Hexagonal Architecture
 */
class UserModule extends ModuleContract {
  constructor() {
    super();
    this.name = 'UserModule';
    this.isInitialized = false;
    this.dependencies = {};
    this.controllers = {};
    this.middleware = {};
    this.router = express.Router();
  }

  /**
   * Initialize the User Module
   */
  async initialize(dependencies) {
    if (this.isInitialized) {
      return this;
    }

    try {
      this.dependencies = dependencies;

      // Initialize middleware
      await this._initializeMiddleware();

      // Initialize controllers
      await this._initializeControllers();

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
      // Test application services
      const authService = this.dependencies.authenticationApplicationService;
      const userService = this.dependencies.userApplicationService;

      return {
        status: 'healthy',
        initialized: this.isInitialized,
        services: {
          authentication: !!authService,
          userManagement: !!userService
        },
        capabilities: this.getCapabilities()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  /**
   * Check if module is ready
   */
  isReady() {
    return this.isInitialized && 
           this.dependencies.authenticationApplicationService && 
           this.dependencies.userApplicationService;
  }

  /**
   * Get module status
   */
  getStatus() {
    return {
      name: this.name,
      initialized: this.isInitialized,
      ready: this.isReady(),
      capabilities: this.getCapabilities()
    };
  }

  /**
   * Get module capabilities
   */
  getCapabilities() {
    return {
      authentication: true,
      userRegistration: true,
      userProfiles: true,
      sessionManagement: true,
      passwordManagement: true,
      userSettings: true,
      otpVerification: true
    };
  }

  /**
   * Shutdown module
   */
  async shutdown() {
    console.log('Shutting down User Module...');
    this.isInitialized = false;
  }

  // Private initialization methods
  async _initializeMiddleware() {
    this.middleware.authentication = new AuthenticationMiddleware(
      this.dependencies.jwtService,
      this.dependencies.authenticationApplicationService
    );

    this.middleware.validation = new ValidationMiddleware();
  }

  async _initializeControllers() {
    this.controllers.auth = new AuthController(
      this.dependencies.authenticationApplicationService
    );

    this.controllers.user = new UserController(
      this.dependencies.userApplicationService
    );

    this.controllers.session = new SessionController(
      this.dependencies.authenticationApplicationService
    );

    this.controllers.settings = new SettingsController(
      this.dependencies.userApplicationService
    );
  }

  async _setupRoutes() {
    // Health check
    this.router.get('/health', async (req, res) => {
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

module.exports = UserModule;