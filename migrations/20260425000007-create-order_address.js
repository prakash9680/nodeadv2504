'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('order_address', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      order_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'CASCADE',
      },
      rec_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
       number: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      city: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      state: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
       Country: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      address_type: {
        type: Sequelize.ENUM('billing', 'shipping'),
        defaultValue: 'shipping',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('order_address');
  },
};
