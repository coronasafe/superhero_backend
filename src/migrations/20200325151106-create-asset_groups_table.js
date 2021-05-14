"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("asset_groups", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        defaultValue: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      title: { type: Sequelize.STRING, allowNull: false },
      security_level: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      mobility: { type: Sequelize.BOOLEAN, defaultValue: true },
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
    return queryInterface.dropTable("asset_groups");
  }
};
