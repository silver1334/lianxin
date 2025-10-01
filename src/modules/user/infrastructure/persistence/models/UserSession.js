const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    session_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
      allowNull: false
    },
    refresh_token: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Hashed refresh token'
    },
    device_info: {
      type: DataTypes.JSON,
      allowNull: false
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: false
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_active_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    refresh_issued_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'user_sessions',
    indexes: [
      {
        unique: true,
        fields: ['session_id']
      },
      {
        fields: ['user_id']
      },
      {
        fields: ['refresh_token']
      },
      {
        fields: ['is_active']
      },
      {
        fields: ['expires_at']
      }
    ]
  });

  return UserSession;
};