const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserProfile = sequelize.define('UserProfile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    display_name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted display name'
    },
    first_name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted first name'
    },
    last_name: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted last name'
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted bio'
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    cover_photo_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    birth_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
      allowNull: true
    },
    hometown: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted hometown'
    },
    lives_in: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted current location'
    },
    interested_in: {
      type: DataTypes.ENUM('male', 'female', 'both', 'other'),
      allowNull: true
    },
    occupation: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Encrypted occupation'
    },
    salary: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    relationship_status: {
      type: DataTypes.ENUM('single', 'in_relationship', 'married', 'divorced', 'widowed', 'complicated'),
      allowNull: true
    },
    languages: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    hobbies: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    privacy_settings: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    tableName: 'user_profiles',
    indexes: [
      {
        unique: true,
        fields: ['user_id']
      },
      {
        fields: ['birth_date']
      },
      {
        fields: ['gender']
      }
    ]
  });

  return UserProfile;
};