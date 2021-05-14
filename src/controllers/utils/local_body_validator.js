const District = require("../../models").district;
const SubDistrict = require("../../models").sub_district;
const PLB = require("../../models").plb;
module.exports = {
  async getValidDistrict(name) {
    let district = await District.findOne({
      where: { name: name.toUpperCase() }
    });
    return district;
  },
  // async validateSubDistrict(name) {
  //   let sub_district = await SubDistrict.findOne({ where: { name: name } });
  //   return sub_district;
  // },
  async getValidPLB(name, district_name) {
    let district = await District.findOne({
      where: { name: district_name.toUpperCase() }
    });
    let plb = await PLB.findOne({
      where: { name: name.toUpperCase(), district: district.dataValues.id }
    });
    return plb;
  }
};
