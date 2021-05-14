"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("meal_requests", "active", {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    });
    await queryInterface.addColumn("meal_requests", "requested", {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    return queryInterface.addColumn("meal_requests", "delivered", {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("meal_requests", "active");
    await queryInterface.removeColumn("meal_requests", "requested");
    return queryInterface.removeColumn("meal_requests", "delivered");
  }
};
