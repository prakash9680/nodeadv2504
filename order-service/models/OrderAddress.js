const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const OrderAddress = sequelize.define('OrderAddress', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  orderId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'order_id',
  },
  recName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'rec_name',
  },
  number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'number',
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'address',
  },
  city: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'city',
  },
   state: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'state',
  },
   postalCode: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'postal_code',
  },
   Country: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'Country',
  },
  addressType: {
    type: DataTypes.ENUM('billing','shipping'),
    defaultValue: 'shipping',
  }
}, {
  tableName: 'order_address',
});

module.exports = OrderAddress;