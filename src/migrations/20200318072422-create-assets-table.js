"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("assets", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      name: {
        type: Sequelize.STRING
      },
      location: {
        type: Sequelize.GEOMETRY("POINT"),
      },
      location_update_timestamp: {
        type: Sequelize.DATE
      },
      phone: {
        type: Sequelize.STRING,
        unique: true
      },
      category: {
        type: Sequelize.STRING
      },
      security_level: {
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
    return queryInterface.dropTable("assets");
  }
};
