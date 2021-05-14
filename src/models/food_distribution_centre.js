"use strict";
module.exports = (sequelize, DataTypes) => {
  var food_distribution_centre = sequelize.define(
    "food_distribution_centre",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      name: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      location: { type: DataTypes.GEOMETRY("POINT") },
      district: {
        type: DataTypes.STRING
      },
      sub_district: {
        type: DataTypes.STRING
      },
      plb: { type: DataTypes.STRING },
      ward: { type: DataTypes.STRING },
      phone: { type: DataTypes.STRING }
    },
    {}
  );
  food_distribution_centre.associate = function(models) {
    // associations can be defined here
    food_distribution_centre.hasMany(models.meal_request, {
      as: "requestDetails",
      foreignKey: { name: "fdc" }
    });
  };
  return food_distribution_centre;
};
