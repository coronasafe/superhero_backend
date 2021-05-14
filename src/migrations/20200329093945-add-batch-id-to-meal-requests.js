"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("meal_requests", "batch_id", {
      type: Sequelize.UUID,
      defaultValue:Sequelize.UUIDV4
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("meal_requests", "batch_id");
  }
};
