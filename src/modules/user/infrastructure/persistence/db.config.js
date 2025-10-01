const securityConfig = require('../../../../shared/config/security.config');

/**
 * User Module Database Configuration
 * Self-contained database configuration for the User bounded context
 */
module.exports = {
  development: {
    host: securityConfig.database.host,
    port: securityConfig.database.port,
    username: securityConfig.database.username,
    password: securityConfig.database.password,
    database: 'lianxin_user_db',
    dialect: 'mysql',
    logging: console.log,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  },
  production: {
    host: securityConfig.database.host,
    port: securityConfig.database.port,
    username: securityConfig.database.username,
    password: securityConfig.database.password,
    database: 'lianxin_user_db',
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    timezone: '+08:00',
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    }
  }
};