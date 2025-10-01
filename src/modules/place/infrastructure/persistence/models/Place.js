const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Place = sequelize.define('Place', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: false
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: false
    },
    category: {
      type: DataTypes.ENUM('restaurant', 'cafe', 'bar', 'hotel', 'attraction', 'shopping', 'entertainment', 'other'),
      allowNull: false
    },
    subcategory: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    website: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    opening_hours: {
      type: DataTypes.JSON,
      allowNull: true
    },
    price_range: {
      type: DataTypes.ENUM('$', '$$', '$$$', '$$$$'),
      allowNull: true
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    review_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    photos: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    amenities: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending_approval', 'suspended'),
      defaultValue: 'pending_approval'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who created this place'
    }
  }, {
    tableName: 'places',
    indexes: [
      {
        unique: true,
        fields: ['uuid']
      },
      {
        fields: ['name']
      },
      {
        fields: ['category']
      },
      {
        fields: ['latitude', 'longitude']
      },
      {
        fields: ['rating']
      },
      {
        fields: ['status']
      },
      {
        fields: ['verified']
      }
    ]
  });

  return Place;
};