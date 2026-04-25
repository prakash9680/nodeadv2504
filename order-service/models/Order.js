const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Order = sequelize.define('Order', {
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
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'user_id',
  },
  totalPrice: {
    type: DataTypes.DOUBLE,
    defaultValue: false,
    field: 'total_price',
  },
  status: {
    type: DataTypes.ENUM('pending','confirmed','shipped','delivered','cancelled'),
    defaultValue: 'pending',
  }
}, {
  tableName: 'orders',
});

module.exports = Order;
