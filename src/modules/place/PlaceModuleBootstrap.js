const express = require('express');
const DependencyContainer = require('../../infrastructure/config/DependencyContainer');

// Infrastructure Adapters
const PlaceMySQLAdapter = require('./infrastructure/persistence/PlaceMySQLAdapter');

// Database Setup
const placeDatabaseSetup = require('./infrastructure/persistence/models');

/**
 * Place Module Bootstrap
 * Self-contained bootstrap for the Place bounded context
 */
class PlaceModuleBootstrap {
  constructor() {
    this.name = 'PlaceModule';
    this.container = new DependencyContainer();
    this.router = express.Router();
    this.isInitialized = false;
    this.database = null;
    this.controllers = {};
    this.services = {};
  }

  /**
   * Initialize the Place Module
   */
  async initialize(globalContainer) {
    if (this.isInitialized) {
      return this;
    }

    try {
      console.log('Initializing Place Module...');

      // Initialize database
      await this._initializeDatabase();

      // Configure dependencies
      await this._configureDependencies(globalContainer);

      // Initialize services and controllers
      await this._initializeServices();
      await this._initializeControllers();

      // Setup routes
      await this._setupRoutes();

      this.isInitialized = true;

      console.log('Place Module initialized successfully');
      return this;

    } catch (error) {
      console.error('Place Module initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get module router
   */
  getRouter() {
    if (!this.isInitialized) {
      throw new Error('Place Module not initialized');
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

      return {
        status: dbHealth ? 'healthy' : 'unhealthy',
        database: dbHealth,
        initialized: this.isInitialized,
        capabilities: {
          placeManagement: true,
          placeSearch: true,
          locationBasedSearch: true,
          placeCategories: true
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
    console.log('Shutting down Place Module...');
    
    try {
      if (this.database) {
        await this.database.shutdown();
      }
      
      this.container.clear();
      this.isInitialized = false;
      
      console.log('Place Module shut down successfully');
    } catch (error) {
      console.error('Error during Place Module shutdown:', error);
      throw error;
    }
  }

  // Private initialization methods
  async _initializeDatabase() {
    this.database = await placeDatabaseSetup.initialize();
    console.log('Place Module database initialized');
  }

  async _configureDependencies(globalContainer) {
    // Register database components
    this.container
      .registerInstance('placeSequelize', this.database.sequelize)
      .registerInstance('placeModels', this.database.models);

    // Register place repository
    this.container
      .registerSingleton('placeRepository', async (container) => {
        const sequelize = await container.resolve('placeSequelize');
        const models = await container.resolve('placeModels');
        const cacheService = await globalContainer.resolve('cacheService');
        return new PlaceMySQLAdapter(sequelize, models, cacheService);
      });
  }

  async _initializeServices() {
    // Place domain services
    this.services.place = {
      searchNearby: async (latitude, longitude, radius = 1000) => {
        const placeRepository = await this.container.resolve('placeRepository');
        return await placeRepository.search('', {
          latitude,
          longitude,
          radius
        });
      },
      
      getPlaceDetails: async (placeId) => {
        const placeRepository = await this.container.resolve('placeRepository');
        return await placeRepository.findById(placeId);
      },

      searchPlaces: async (query, filters = {}) => {
        const placeRepository = await this.container.resolve('placeRepository');
        return await placeRepository.search(query, filters);
      }
    };
  }

  async _initializeControllers() {
    this.controllers.place = {
      searchPlaces: async (req, res, next) => {
        try {
          const { query, lat, lng, radius, category, limit, offset } = req.query;

          let result;
          if (lat && lng) {
            result = await this.services.place.searchNearby(
              parseFloat(lat),
              parseFloat(lng),
              parseInt(radius) || 1000
            );
          } else {
            result = await this.services.place.searchPlaces(query || '', {
              category,
              limit: parseInt(limit) || 20,
              offset: parseInt(offset) || 0
            });
          }

          res.json({
            success: true,
            data: result,
            message: 'Places retrieved successfully'
          });
        } catch (error) {
          next(error);
        }
      },

      getPlaceDetails: async (req, res, next) => {
        try {
          const { placeId } = req.params;

          const place = await this.services.place.getPlaceDetails(placeId);
          if (!place) {
            return res.status(404).json({
              success: false,
              error: { message: 'Place not found' }
            });
          }

          res.json({
            success: true,
            data: { place },
            message: 'Place details retrieved successfully'
          });
        } catch (error) {
          next(error);
        }
      }
    };
  }

  async _setupRoutes() {
    // Health check
    this.router.get('/place/health', async (req, res) => {
      const health = await this.getHealthStatus();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json({
        success: health.status === 'healthy',
        data: health,
        message: `Place module is ${health.status}`
      });
    });

    // Place routes
    this.router.get('/places/search', this.controllers.place.searchPlaces);
    this.router.get('/places/:placeId', this.controllers.place.getPlaceDetails);
  }
}

module.exports = PlaceModuleBootstrap;