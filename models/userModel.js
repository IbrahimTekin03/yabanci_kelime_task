const { DataTypes } = require('sequelize');
const sequelize = require('../db/dbConnection');
const Joi = require('@hapi/joi');
const jwt = require('jsonwebtoken');
const Role = require('./roleModel');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  isim: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 50]
    }
  },
  userName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 50]
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  sifre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  email_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true
});

// Joi validation schema
const schema = Joi.object({
  isim: Joi.string().min(3).max(50).required(),
  userName: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  sifre: Joi.string().required(),
  isActive: Joi.boolean(),
  email_active: Joi.boolean()
});

// Instance method for Joi validation
User.prototype.joiValidation = function (userObject) {
  return schema.validate(userObject);
};

// Static method for Joi validation on update
User.joiValidationForUpdate = function (userObject) {
  return schema.validate(userObject);
};

// İlişki tanımlama
const UserRole = require('./userRoleModel'); // Ara tabloyu içe aktarın
User.belongsToMany(Role, { through: UserRole, foreignKey: 'userId' });
Role.belongsToMany(User, { through: UserRole, foreignKey: 'roleId' });

// Kullanıcı için JWT token oluşturma fonksiyonu
User.prototype.generateToken = async function () {
  try {
    const user = this;
    const roles = await user.getRoles(); // Kullanıcının rollerini al
    const token = jwt.sign(
      { _id: user.id, roles: roles.map(role => role.name) },
      "secretkey", // Bu anahtarı çevresel değişkenlerden almanız daha güvenli olur
      { expiresIn: "2h" }
    );
    return token;
  } catch (error) {
    throw new Error("Token oluşturulurken bir hata oluştu.");
  }
};

module.exports = User;