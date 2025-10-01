const { Sequelize } = require('sequelize');
const dbConfig = require('../db.config');

/**
 * Place Module Database Initialization
 * Self-contained database setup for the Place bounded context
 */
class PlaceDatabaseSetup {
  constructor() {
    this.sequelize = null;
    this.models = {};
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return {
        sequelize: this.sequelize,
        models: this.models,
        testConnection: this.testConnection.bind(this)
      };
    }

    try {
      const env = process.env.NODE_ENV || 'development';
      const config = dbConfig[env];

      // Create Sequelize instance
      this.sequelize = new Sequelize(config);

      // Load models
      this.models.Place = require('./Place')(this.sequelize);

      // Define associations (if any)
      this._defineAssociations();

      // Test connection
      await this.testConnection();

      // Sync database (in development)
      if (env === 'development') {
        await this.sequelize.sync({ alter: true });
        console.log('Place module database synchronized');
      }

      this.isInitialized = true;

      console.log('Place module database initialized successfully');

      return {
        sequelize: this.sequelize,
        models: this.models,
        testConnection: this.testConnection.bind(this)
      };

    } catch (error) {
      console.error('Place module database initialization failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log('Place module database connection established successfully');
      return true;
    } catch (error) {
      console.error('Place module database connection failed:', error);
      return false;
    }
  }

  _defineAssociations() {
    const { Place } = this.models;

    // Define associations here when needed
    // For example, if Place has reviews, categories, etc.
  }

  async shutdown() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('Place module database connection closed');
    }
  }
}

module.exports = new PlaceDatabaseSetup();