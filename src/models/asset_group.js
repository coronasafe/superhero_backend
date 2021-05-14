"use strict";
module.exports = (sequelize, DataTypes) => {
  var asset_group = sequelize.define(
    "asset_group",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      title: { type: DataTypes.STRING, allowNull: false },
      security_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      mobility: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {}
  );
  asset_group.associate = function(models) {
    // associations can be defined here
    asset_group.hasMany(models.asset_category, {
      as: "categoryList",
      foreignKey: { name: "group" }
    });
  };
  return asset_group;
};
