const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    phone: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'Encrypted phone number'
    },
    phone_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: 'Hashed phone number for lookups'
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'deactivated', 'pending_deletion'),
      defaultValue: 'active'
    },
    suspension_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    suspension_until: {
      type: DataTypes.DATE,
      allowNull: true
    },
    last_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registration_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    last_ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    last_failed_login: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deactivated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pending_deletion_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_changed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_history: {
      type: DataTypes.JSON,
      defaultValue: []
    }
  }, {
    tableName: 'users',
    indexes: [
      {
        unique: true,
        fields: ['phone_hash']
      },
      {
        unique: true,
        fields: ['uuid']
      },
      {
        fields: ['status']
      },
      {
        fields: ['last_login']
      }
    ]
  });

  return User;
};