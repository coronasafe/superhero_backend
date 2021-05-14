"use strict";
const UUIDV4 = require("uuid/v4");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "asset_groups",
      [
        {
          id: 0,
          title: "Ambulance",
          mobility: true,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: 1,
          title: "Food Delivery",
          mobility: true,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "Medicine Delivery",
          mobility: true,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        {
          id: 3,
          title: "Oxygen Transport",
          mobility: true,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("asset_groups", null, {});
  },
};
