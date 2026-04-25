const { DataTypes } = require("sequelize");
const sequelize = require("../../shared/config/database");

const Vendor = sequelize.define('Vendor', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
    },
    store_name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    store_description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    is_verified: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: Sequelize.DATE,
      allowNull: false,
      defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
    }
  }
);

module.exports = Vendor;
