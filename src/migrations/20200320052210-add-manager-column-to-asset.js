"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("assets", "manager", {
      type: Sequelize.UUID,
      references: {
        model: "asset_managers",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("assets","manager")
  }
};
