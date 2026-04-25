const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const OrderProduct = sequelize.define('OrderProduct', {
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
  productId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'product_id',
  },
  vendorName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'vendor_name',
  },
  productTitle: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'product_title',
  },
  totalPrice: {
    type: DataTypes.DOUBLE,
    defaultValue: false,
    field: 'total_price',
  },
  unitPrice: {
    type: DataTypes.DOUBLE,
    defaultValue: false,
    field: 'unit_price',
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: false,
    field: 'quantity',
  }
}, {
  tableName: 'order_products',
});

module.exports = OrderProduct;