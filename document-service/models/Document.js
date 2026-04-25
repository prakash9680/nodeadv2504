const { DataTypes } = require('sequelize');
const sequelize = require('../../shared/config/database');

const Document = sequelize.define('Document', {
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
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
  },
  s3Key: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 's3_key',
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'mime_type',
  },
  size: {
    type: DataTypes.BIGINT,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('uploaded', 'processing', 'completed', 'failed'),
    defaultValue: 'uploaded',
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  processingResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'processing_result',
  },
  checksum: {
    type: DataTypes.STRING(64),
    allowNull: true,
  },
}, {
  tableName: 'documents',
});

module.exports = Document;
