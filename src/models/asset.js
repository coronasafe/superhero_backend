"use strict";
module.exports = (sequelize, DataTypes) => {
  var asset = sequelize.define(
    "asset",
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
      location: {
        type: DataTypes.GEOMETRY("POINT")
      },
      location_update_timestamp: {
        type: DataTypes.DATE
      },
      phone: {
        type: DataTypes.STRING,
        unique: true
      },
      category: {
        type: DataTypes.INTEGER
      },
      security_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      reg_no: { type: DataTypes.STRING },
      reserved: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
      // password: {
      //   type: DataTypes.STRING
      // }
    },
    {}
  );
  asset.associate = function(models) {
    // associations can be defined here
    asset.hasMany(models.asset_manager, {
      as: "managerDetails",
      foreignKey: { name: "asset" }
    });
    asset.belongsTo(models.asset_category, {
      as: "categoryDetails",
      foreignKey: { name: "category" }
    });
  };
  return asset;
};
