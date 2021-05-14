"use strict";
module.exports = (sequelize, DataTypes) => {
  var user_category = sequelize.define(
    "user_category",
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
      clearence_level: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {}
  );
  user_category.associate = function(models) {
    // associations can be defined here
  };
  return user_category;
};
