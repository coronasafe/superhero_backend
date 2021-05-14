"use strict";
module.exports = (sequelize, DataTypes) => {
  var asset_category = sequelize.define(
    "asset_category",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        defaultValue: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      title: { type: DataTypes.STRING, allowNull: false },
      group: { type: DataTypes.INTEGER, defaultValue: 0 },
      security_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      mobility: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    {}
  );
  asset_category.associate = function(models) {
    // associations can be defined here
    asset_category.belongsTo(models.asset_group, {
      as: "groupDetails",
      foreignKey: { name: "group" }
    });
  };
  return asset_category;
};
