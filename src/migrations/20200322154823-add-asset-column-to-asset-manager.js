"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("asset_managers", "asset", {
      type: Sequelize.UUID,
      references: {
        model: "assets",
        key: "id"
      },
      onUpdate: "CASCADE",
      onDelete: "RESTRICT"
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("asset_managers","asset")
  }
};
