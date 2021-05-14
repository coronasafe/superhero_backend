"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("asset_managers", "district", {
      type: Sequelize.STRING
    });
    await queryInterface.addColumn("asset_managers", "ward_no", {
      type: Sequelize.STRING
    });
    return queryInterface.addColumn("asset_managers", "plb", {
      type: Sequelize.STRING
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("asset_managers", "district");
    await queryInterface.removeColumn("asset_managers", "ward_no");
    return queryInterface.removeColumn("asset_managers", "plb");
  }
};
