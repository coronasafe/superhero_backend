"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("meal_requests", "no_in_batch", {
      type: Sequelize.INTEGER,
      defaultValue:1
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("meal_requests", "no_in_batch");
  }
};
