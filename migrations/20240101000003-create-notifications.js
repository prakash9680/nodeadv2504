'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      document_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'documents', key: 'id' },
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.ENUM('email', 'sms', 'in_app'),
        defaultValue: 'in_app',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
