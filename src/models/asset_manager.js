"use strict";
module.exports = (sequelize, DataTypes) => {
  var asset_manager = sequelize.define(
    "asset_manager",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      name: {
        type: DataTypes.STRING
      },
      email: {
        type: DataTypes.STRING,
        unique: true
      },
      phone: {
        type: DataTypes.STRING,
        unique: true
      },
      password: {
        type: DataTypes.STRING
      },
      category: {
        type: DataTypes.STRING
      },
      clearence_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "default"
      },
      fcm_token: { type: DataTypes.STRING },
      // state: { type: DataTypes.STRING, defaultValue: "kerala" },
      district: { type: DataTypes.STRING },
      plb: { type: DataTypes.STRING },
      ward_no: { type: DataTypes.STRING }
    },
    {}
  );
  asset_manager.associate = function (models) {
    // associations can be defined here
    asset_manager.belongsTo(models.state, {
      as: "stateDetails",
      foreignKey: { name: "state" }
    });
    asset_manager.belongsTo(models.asset, {
      as: "assetDetails",
      foreignKey: { name: "asset" }
    });
    asset_manager.belongsTo(models.service_request, {
      as: "activeServiceDetails",
      foreignKey: { name: "current_service" }
    });
  };
  return asset_manager;
};
