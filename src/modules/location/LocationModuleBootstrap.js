const express = require('express');
const DependencyContainer = require('../../infrastructure/config/DependencyContainer');

/**
 * Location Module Bootstrap
 * Self-contained bootstrap for the Location bounded context
 */
class LocationModuleBootstrap {
  constructor() {
    this.name = 'LocationModule';
    this.container = new DependencyContainer();
    this.router = express.Router();
    this.isInitialized = false;
    this.controllers = {};
  }

  /**
   * Initialize the Location Module
   */
  async initialize(globalContainer) {
    if (this.isInitialized) {
      return this;
    }

    try {
      console.log('Initializing Location Module...');

      // Configure dependencies
      await this._configureDependencies(globalContainer);

      // Initialize controllers
      await this._initializeControllers();

      // Setup routes
      await this._setupRoutes();

      this.isInitialized = true;

      console.log('Location Module initialized successfully');
      return this;

    } catch (error) {
      console.error('Location Module initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get module router
   */
  getRouter() {
    if (!this.isInitialized) {
      throw new Error('Location Module not initialized');
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
      return {
        status: 'healthy',
        initialized: this.isInitialized,
        capabilities: {
          geocoding: true,
          reverseGeocoding: true,
          distanceCalculation: true,
          locationSearch: true
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
    console.log('Shutting down Location Module...');
    
    try {
      this.container.clear();
      this.isInitialized = false;
      
      console.log('Location Module shut down successfully');
    } catch (error) {
      console.error('Error during Location Module shutdown:', error);
      throw error;
    }
  }

  // Private initialization methods
  async _configureDependencies(globalContainer) {
    // Location module uses cache for geocoding results
    const cacheService = await globalContainer.resolve('cacheService');
    this.container.registerInstance('cacheService', cacheService);
  }

  async _initializeControllers() {
    this.controllers.location = {
      geocode: async (req, res, next) => {
        try {
          const { address } = req.query;

          // Mock geocoding
          res.json({
            success: true,
            data: {
              address,
              latitude: 39.9042,
              longitude: 116.4074,
              formatted_address: 'Beijing, China',
              components: {
                city: 'Beijing',
                country: 'China',
                country_code: 'CN'
              }
            },
            message: 'Address geocoded successfully'
          });
        } catch (error) {
          next(error);
        }
      },

      reverseGeocode: async (req, res, next) => {
        try {
          const { lat, lng } = req.query;

          // Mock reverse geocoding
          res.json({
            success: true,
            data: {
              latitude: parseFloat(lat),
              longitude: parseFloat(lng),
              formatted_address: 'Beijing, China',
              components: {
                city: 'Beijing',
                country: 'China',
                country_code: 'CN'
              }
            },
            message: 'Coordinates reverse geocoded successfully'
          });
        } catch (error) {
          next(error);
        }
      }
    };
  }

  async _setupRoutes() {
    // Health check
    this.router.get('/location/health', async (req, res) => {
      const health = await this.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
        message: `Location module is ${health.status}`
      });
    });

    // Location routes
    this.router.get('/location/geocode', this.controllers.location.geocode);
    this.router.get('/location/reverse-geocode', this.controllers.location.reverseGeocode);
  }
}

module.exports = LocationModuleBootstrap;