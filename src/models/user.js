"use strict";
module.exports = (sequelize, DataTypes) => {
  var user = sequelize.define(
    "user",
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
      district_restriction: { type: DataTypes.STRING },
      plb_restriction: { type: DataTypes.STRING }
    },
    {}
  );
  user.associate = function(models) {
    // associations can be defined here
    user.belongsTo(models.state, {
      as: "stateDetails",
      foreignKey: { name: "state" }
    });
  };
  return user;
};
