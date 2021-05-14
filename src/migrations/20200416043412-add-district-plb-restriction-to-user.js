"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("users", "plb_restriction", {
      type: Sequelize.STRING,
    });
    return queryInterface.addColumn("users", "district_restriction", {
      type: Sequelize.STRING,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("users", "plb_restriction");
    return queryInterface.removeColumn("users", "district_restriction");
  }
};
