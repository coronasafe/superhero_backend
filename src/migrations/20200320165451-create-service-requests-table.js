"use strict";
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("service_requests", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      category: {
        type: Sequelize.INTEGER
      },
      address_0: {
        type: Sequelize.STRING
      },
      address_1: {
        type: Sequelize.STRING
      },
      location_0: {
        type: Sequelize.GEOMETRY("POINT")
      },
      location_1: {
        type: Sequelize.GEOMETRY("POINT")
      },
      requestee: {
        type: Sequelize.UUID,
        references: {
          model: "users",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      requested_unit_count: {
        type: Sequelize.STRING,
        defaultValue: 1
      },
      responded_unit_count: {
        type: Sequelize.STRING,
        defaultValue: 0
      },
      notified_units: {
        type: Sequelize.ARRAY(Sequelize.UUID)
      },
      responded_units: {
        type: Sequelize.ARRAY(Sequelize.UUID)
      },
      active: { type: Sequelize.BOOLEAN, defaultValue: true },
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
    return queryInterface.dropTable("service_requests");
  }
};
