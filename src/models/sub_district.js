"use strict";
module.exports = (sequelize, DataTypes) => {
  var sub_district = sequelize.define(
    "sub_district",
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
      }
    },
    {}
  );
  sub_district.associate = function(models) {
    // associations can be defined here
    sub_district.belongsTo(models.district, {
      as: "districtDetails",
      foreignKey: { name: "district" }
    });
  };
  return sub_district;
};
