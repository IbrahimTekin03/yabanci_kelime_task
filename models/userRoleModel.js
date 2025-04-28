const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnection');
const User = require('./userModel');
const Role = require('./roleModel');

const UserRole = sequelize.define('UserRole', {
  userId: {
    type: DataTypes.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id'
    }
  }
}, {
  tableName: 'user_roles',
  timestamps: false
});

module.exports = UserRole;