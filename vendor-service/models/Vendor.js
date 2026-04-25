const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Vendor = sequelize.define('Vendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  storeName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'store_name',
  },
  storeDescription: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'store_description',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_verified',
  }
}, {
  tableName: 'vendors',
});

module.exports = Vendor;