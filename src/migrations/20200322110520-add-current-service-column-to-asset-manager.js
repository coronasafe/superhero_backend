"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("asset_managers", "current_service", {
      type: Sequelize.UUID,
      references: {
        model: "service_requests",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL"
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("asset_managers", "current_service");
  }
};
