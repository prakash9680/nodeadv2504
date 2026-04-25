'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('product_images', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      product_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'products', key: 'id' },
        onDelete: 'CASCADE',
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      original_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      s3_key: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      size: {
        type: Sequelize.BIGINT,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('uploaded', 'processing', 'completed', 'failed'),
        defaultValue: 'uploaded',
      },
      progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      processing_result: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      checksum: {
        type: Sequelize.STRING(64),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('product_images');
  },
};
