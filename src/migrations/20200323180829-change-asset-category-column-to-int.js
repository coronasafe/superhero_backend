"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("assets", "category");
    return queryInterface.addColumn("assets", "category", {
      type: Sequelize.INTEGER
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("assets", "category");
    return queryInterface.addColumn("assets", "category", {
      type: Sequelize.STRING
    });
  }
};
