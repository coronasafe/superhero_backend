"use strict";
module.exports = (sequelize, DataTypes) => {
  var service_request = sequelize.define(
    "service_request",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: true
      },
      category: {
        type: DataTypes.INTEGER
      },
      requestee: {
        type: DataTypes.UUID,
        references: {
          model: "user",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "RESTRICT"
      },
      address_0: {
        type: DataTypes.STRING
      },
      address_1: {
        type: DataTypes.STRING
      },
      location_0: {
        type: DataTypes.GEOMETRY("POINT")
      },
      location_1: {
        type: DataTypes.GEOMETRY("POINT")
      },
      requested_unit_count: {
        type: DataTypes.STRING,
        defaultValue: 1
      },
      responded_unit_count: {
        type: DataTypes.STRING,
        defaultValue: 0
      },
      notified_units: {
        type: DataTypes.ARRAY(DataTypes.UUID)
      },
      responded_units: {
        type: DataTypes.ARRAY(DataTypes.UUID)
      },
      active: { type: DataTypes.BOOLEAN, defaultValue: true },
      support_contact: {
        type: DataTypes.STRING
      },
      patient_name: {
        type: DataTypes.STRING,
      },
      destination_contact: {
        type: DataTypes.STRING,
      },
      medical_info: {
        type: DataTypes.TEXT,
      },
      picked_up: { type: DataTypes.BOOLEAN, defaultValue: false },
      picked_up_at: { type: DataTypes.DATE },
      group: { type: DataTypes.INTEGER, defaultValue: 0 },
      destination_addresses: { type: DataTypes.JSONB },
      picked_up_units: { type: DataTypes.ARRAY(DataTypes.UUID) },
      completed_units: { type: DataTypes.ARRAY(DataTypes.UUID) },
      cancelled_units: { type: DataTypes.ARRAY(DataTypes.UUID) }
    },
    {}
  );
  service_request.associate = function(models) {
    // associations can be defined here
    service_request.belongsTo(models.user, {
      as: "requesteeDetails",
      foreignKey: { name: "requestee" }
    });
    service_request.belongsTo(models.state, {
      as: "stateDetails",
      foreignKey: { name: "state" }
    });
    service_request.belongsTo(models.asset_category, {
      as: "categoryDetails",
      foreignKey: { name: "category" }
    });
    service_request.belongsTo(models.asset_group, {
      as: "groupDetails",
      foreignKey: { name: "group" }
    });
  };
  return service_request;
};
