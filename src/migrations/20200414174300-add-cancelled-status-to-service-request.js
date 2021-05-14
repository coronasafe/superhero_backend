"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("service_requests", "cancelled_units", {
      type: Sequelize.ARRAY(Sequelize.UUID),
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("service_requests", "cancelled_units");
  }
};
