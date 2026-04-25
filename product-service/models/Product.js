const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  vendorId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'vendor_id',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'title',
  },
  category: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'category',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'category',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_active',
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_deleted',
  },
  price: {
    type: DataTypes.DOUBLE,
    defaultValue: false,
    field: 'price',
  },
  stockQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: false,
    field: 'stock_quantity',
  }
}, {
  tableName: 'products',
});

module.exports = Product;