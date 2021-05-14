"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("service_requests", "picked_up", {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    return queryInterface.addColumn("service_requests", "picked_up_at", {
      type: Sequelize.DATE
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("service_requests", "picked_up");
    return queryInterface.removeColumn("service_requests", "picked_up_at");
  }
};
