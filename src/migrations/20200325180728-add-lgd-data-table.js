"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("districts", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        defaultValue: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      name: { type: Sequelize.STRING, allowNull: false },
      code: { type: Sequelize.STRING },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.dropTable("districts");
  }
};
