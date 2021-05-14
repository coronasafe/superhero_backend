"use strict";
module.exports = (sequelize, DataTypes) => {
  var plb = sequelize.define(
    "plb",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        // defaultValue: DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true
      },
      name: { type: DataTypes.STRING, allowNull: false },
      code: { type: DataTypes.STRING },
      district: {
        type: DataTypes.INTEGER
      },
      sub_district: {
        type: DataTypes.INTEGER
      },
      ward_count: { type: DataTypes.INTEGER }
    },
    {}
  );
  plb.associate = function(models) {
    // associations can be defined here
    plb.belongsTo(models.district, {
      as: "districtDetails",
      foreignKey: { name: "district" }
    });
  };
  return plb;
};
