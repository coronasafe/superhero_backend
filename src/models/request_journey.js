"use strict";
module.exports = (sequelize, DataTypes) => {
  const request_journey = sequelize.define(
    "request_journey",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false,
      },
      service_request: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      manager: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      asset: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
      },
      loc_start: {
        type: DataTypes.GEOMETRY("POINT"),
      },
      loc_pickup: {
        type: DataTypes.GEOMETRY("POINT"),
      },
      loc_dropoff: {
        type: DataTypes.GEOMETRY("POINT"),
      },
      bidirectional: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      distance: { type: DataTypes.INTEGER, defaultValue: 0 },
    },
    {}
  );
  request_journey.associate = function (models) {
    // associations can be defined here
    request_journey.belongsTo(models.asset, {
      as: "assetDetails",
      sourceKey : "asset",
      foreignKey: { name: "id" }
    });
    request_journey.belongsTo(models.asset_manager, {
      as: "managerDetails",
      sourceKey : "manager",
      foreignKey: { name: "id" }
    });
    request_journey.belongsTo(models.service_request, {
      as: "serviceRequestDetails",
      sourceKey : "service_request",
      foreignKey: { name: "id" }
    });
  };
  return request_journey;
};
