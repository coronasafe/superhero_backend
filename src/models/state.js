"use strict";
module.exports = (sequelize, DataTypes) => {
  const State = sequelize.define(
    "state",
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        autoIncrement: false
      },
      state: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "kerala"
      }
    },
    {}
  );
  State.associate = function (models) {
    // associations can be defined here
  };
  return State;
};
