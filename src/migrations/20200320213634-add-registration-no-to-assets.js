"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn("assets", "reg_no", {
      type: Sequelize.STRING,
      unique: true
    });
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn("assets", "reg_no");
  }
};
