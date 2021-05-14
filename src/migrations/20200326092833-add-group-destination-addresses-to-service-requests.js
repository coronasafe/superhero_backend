"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("service_requests", "group", {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    return queryInterface.addColumn(
      "service_requests",
      "destination_addresses",
      {
        type: Sequelize.JSONB
      }
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("service_requests", "group");
    return queryInterface.removeColumn("service_requests", "destination_addresses");
  }
};
