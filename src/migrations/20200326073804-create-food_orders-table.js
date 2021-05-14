"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("meal_requests", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      name: { type: Sequelize.STRING },
      aadhar_no: { type: Sequelize.STRING },
      address: { type: Sequelize.STRING },
      landmark_address: { type: Sequelize.STRING },
      landmark_location: { type: Sequelize.GEOMETRY("POINT") },
      diet_preference: { type: Sequelize.STRING, defaultValue: "VEG" },
      quantity: { type: Sequelize.INTEGER, defaultValue: 1 },
      kids_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      seniors_count: { type: Sequelize.INTEGER, defaultValue: 0 },
      district: {
        type: Sequelize.STRING
      },
      sub_district: {
        type: Sequelize.STRING
      },
      plb: { type: Sequelize.STRING },
      ward: { type: Sequelize.STRING },
      phone: { type: Sequelize.STRING },
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
    return queryInterface.dropTable("meal_requests");
  }
};
