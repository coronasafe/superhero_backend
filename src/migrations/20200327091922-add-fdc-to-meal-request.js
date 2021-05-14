"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("meal_requests", "fdc", {
      type: Sequelize.UUID,
      references: {
        model: "food_distribution_centres",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("meal_requests", "fdc");
  }
};
