const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const AuditLog = sequelize.define('AuditLog', {
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
  enitytId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'enityt_id',
  },
  enitytType: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'enityt_type',
  },
  action: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'action',
  },
  metadata: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'metadata',
  }
}, {
  tableName: 'audit_log',
});

module.exports = AuditLog;