"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("user_categories", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        defaultValue: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      title: { type: Sequelize.STRING, allowNull: false },
      group: { type: Sequelize.INTEGER, defaultValue: 0 },
      clearence_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
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
    return queryInterface.dropTable("user_categories");
  }
};
