const { Sequelize } = require('sequelize');
const dbConfig = require('../db.config');

/**
 * User Module Database Initialization
 * Self-contained database setup for the User bounded context
 */
class UserDatabaseSetup {
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
      this.models.User = require('./User')(this.sequelize);
      this.models.UserSession = require('./UserSession')(this.sequelize);
      this.models.UserProfile = require('./UserProfile')(this.sequelize);

      // Define associations
      this._defineAssociations();

      // Test connection
      await this.testConnection();

      // Sync database (in development)
      if (env === 'development') {
        await this.sequelize.sync({ alter: true });
        console.log('User module database synchronized');
      }

      this.isInitialized = true;

      console.log('User module database initialized successfully');

      return {
        sequelize: this.sequelize,
        models: this.models,
        testConnection: this.testConnection.bind(this)
      };

    } catch (error) {
      console.error('User module database initialization failed:', error);
      throw error;
    }
  }

  async testConnection() {
    try {
      await this.sequelize.authenticate();
      console.log('User module database connection established successfully');
      return true;
    } catch (error) {
      console.error('User module database connection failed:', error);
      return false;
    }
  }

  _defineAssociations() {
    const { User, UserSession, UserProfile } = this.models;

    // User has many sessions
    User.hasMany(UserSession, {
      foreignKey: 'user_id',
      as: 'sessions',
      onDelete: 'CASCADE'
    });

    UserSession.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // User has one profile
    User.hasOne(UserProfile, {
      foreignKey: 'user_id',
      as: 'profile',
      onDelete: 'CASCADE'
    });

    UserProfile.belongsTo(User, {
      foreignKey: 'user_id',
      as: 'user'
    });
  }

  async shutdown() {
    if (this.sequelize) {
      await this.sequelize.close();
      console.log('User module database connection closed');
    }
  }
}

module.exports = new UserDatabaseSetup();