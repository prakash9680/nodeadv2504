const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../shared/config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('admin', 'user','vendor'),
    defaultValue: 'user',
  },
  mfaSecret: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'mfa_secret',
  },
  mfaEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'mfa_enabled',
  },
}, {
  tableName: 'users',
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, parseInt(process.env.BCRYPT_ROUNDS) || 12);
      }
    },
  },
});

User.prototype.validatePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

User.prototype.toSafeJSON = function () {
  const { password, mfaSecret, ...safe } = this.toJSON();
  return safe;
};

module.exports = User;
