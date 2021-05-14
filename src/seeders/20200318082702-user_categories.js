"use strict";
const UUIDV4 = require("uuid/v4");

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "user_categories",
      [
        {
          id: 1,
          title: "Hospital Staff",
          group: 0,
          updatedAt: new Date(),
          createdAt: new Date()
        },
        {
          id: 2,
          title: "Self Registered",
          group: 1,
          updatedAt: new Date(),
          createdAt: new Date()
        },
        {
          id: 3,
          title: "FDC Volunteer",
          group: 1,
          updatedAt: new Date(),
          createdAt: new Date()
        },
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("user_categories", null, {});
  }
};
