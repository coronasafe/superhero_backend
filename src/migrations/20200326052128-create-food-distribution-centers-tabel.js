"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("food_distribution_centres", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      name: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      location: { type: Sequelize.GEOMETRY("POINT") },
      district: {
        type: Sequelize.STRING
      },
      sub_district: {
        type: Sequelize.STRING
      },
      plb: { type: Sequelize.STRING },
      ward: { type: Sequelize.STRING },
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
    return queryInterface.dropTable("food_distribution_centres");
  }
};
