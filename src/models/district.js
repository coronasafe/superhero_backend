"use strict";
module.exports = (sequelize, DataTypes) => {
  var district = sequelize.define(
    "district",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        // defaultValue: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      name: { type: DataTypes.STRING, allowNull: false },
      code: { type: DataTypes.STRING }
    },
    {}
  );
  district.associate = function(models) {
    // associations can be defined here
    district.hasMany(models.meal_request, {
      as: "mealRequests",
      foreignKey: "district",
      sourceKey: "name"
    });
    district.hasMany(models.plb, {
      as: "panchayaths",
      foreignKey: "district"
    });
  };
  return district;
};
