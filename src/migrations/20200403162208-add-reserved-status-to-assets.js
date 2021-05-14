"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn("assets", "reserved", {
      type: Sequelize.BOOLEAN,
      defaultValue:false
    });
  },

  down: async (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("assets", "reserved");
  }
};
