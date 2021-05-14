"use strict";
module.exports = (sequelize, DataTypes) => {
  var meal_request = sequelize.define(
    "meal_request",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      name: { type: DataTypes.STRING },
      aadhar_no: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      landmark_address: { type: DataTypes.STRING },
      landmark_location: { type: DataTypes.GEOMETRY("POINT") },
      diet_preference: { type: DataTypes.STRING, defaultValue: "VEG" },
      quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
      kids_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      seniors_count: { type: DataTypes.INTEGER, defaultValue: 0 },
      phone: { type: DataTypes.STRING },
      district: {
        type: DataTypes.STRING
      },
      sub_district: {
        type: DataTypes.STRING
      },
      plb: { type: DataTypes.STRING },
      ward: { type: DataTypes.STRING },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      requested: { type: DataTypes.BOOLEAN, defaultValue: false },
      delivered: { type: DataTypes.BOOLEAN, defaultValue: false },
      order_id: {
        type: DataTypes.STRING
      },
      batch_id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4
      },
      no_in_batch: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      },
      batch_size: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      }
    },
    {}
  );
  meal_request.associate = function(models) {
    // associations can be defined here
    meal_request.belongsTo(models.food_distribution_centre, {
      as: "FDCDetails",
      foreignKey: { name: "fdc" }
    });
    meal_request.belongsTo(models.user, {
      as: "volunteerDetails",
      foreignKey: { name: "volunteer" }
    });

    meal_request.belongsTo(models.service_request, {
      as: "serviceRequestDetails",
      foreignKey: { name: "service_request" }
    });
    meal_request.belongsTo(models.district, {
      as: "districtDetails",
      foreignKey: "district",
      targetKey: "name"
    });
  };
  return meal_request;
};
