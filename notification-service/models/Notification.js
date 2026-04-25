const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Notification = sequelize.define('Notification', {
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
  documentId: {
    type: DataTypes.UUID,
    allowNull: true,
    field: 'document_id',
  },
  type: {
    type: DataTypes.ENUM('email', 'sms', 'in_app'),
    defaultValue: 'in_app',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_read',
  },
}, {
  tableName: 'notifications',
});

module.exports = Notification;
