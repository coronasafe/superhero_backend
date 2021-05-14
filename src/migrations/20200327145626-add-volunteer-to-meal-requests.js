"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("meal_requests", "volunteer", {
      type: Sequelize.UUID,
      references: {
        model: "users",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("meal_requests", "volunteer");
  }
};
