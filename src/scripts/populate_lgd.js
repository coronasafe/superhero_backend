const parse = require("csv-parse");
const fs = require("fs");
const path = require("path");
const District = require("../models").district;
const SubDistrict = require("../models").sub_district;
const PLB = require("../models").plb;
let village_data = fs.readFileSync(
  path.resolve(__dirname, "../datasets/villages_kerala.csv")
);
let plb = fs.readFileSync(
  path.resolve(__dirname,"../datasets/plb.csv")
);
let ward_list = require("../datasets/list_of_wards.json");
let districts = {};
let sub_districts = {};
let lb_dist = {};
let lb_imm_p = {};
let lb_vil_p = [];
parse(village_data, (err, output) => {
  for (let row of output) {
    let data = row[0].split(";");
    if (!districts[data[4]] && data[4] != "District Name (In English)") {
      districts[data[4]] = {
        code: data[3],
        name: data[4],
        sub_districts: {}
      };
    }
  }
  for (let row of output) {
    let data = row[0].split(";");
    console.log(districts, data);
    if (
      data[4] != "District Name (In English)" &&
      !districts[data[4]].sub_districts[data[6]]
    ) {
      districts[data[4]].sub_districts[data[6]] = {
        name: data[6],
        code: data[5]
      };
      sub_districts[data[6]] = {
        name: data[6],
        code: data[5],
        district: data[4]
      };
    }
  }
  Object.keys(districts).forEach(async (district, i) => {
    let _existing_district = await District.findOne({
      where: { name: district }
    });
    if (!_existing_district) {
      await District.create({
        name: district,
        code: districts[district].code
      }).catch(error => {
        console.log(error);
      });
    }
  });
  console.log(sub_districts);
  Object.keys(sub_districts).forEach(async (sub_district, i) => {
    let current_district = await District.findOne({
      where: {
        name: sub_districts[sub_district].district.toUpperCase().toString()
      }
    });
    console.log(
      current_district.dataValues.name,
      sub_district,
      sub_districts[sub_district].district.toUpperCase()
    );
    let _existing_sub_district = await SubDistrict.findOne({
      where: {
        name: sub_district,
        district: current_district.dataValues.id
      }
    });
    if (!_existing_sub_district) {
      await SubDistrict.create({
        name: sub_district,
        code: sub_districts[sub_district].code,
        district: current_district.dataValues.id
      }).catch(error => {
        console.log(error);
      });
    }
  });
  parse(plb, async (err, output) => {
    output.splice(0, 1);
    console.log("hellooo\n\n\n\n\n\n\n", output[0]);
    // for (let row_0 of output) {
    //   if (row_0[6] == "District Panchayat") {
    //     districts[row_0[3]["lbc"]] = row_0[1];
    //     lb_dist[row_0[1]] = districts[row_0[3]];
    //   } else if (row_0[6] == "Intermediate Panchayat") {
    //     lb_imm_p[row_0[1]] = lb_dist[row_0[7]];
    //   } else if (row_0[6] == "Village Panchayat") {
    //     lb_vil_p.push({ name: row_0[3], district: lb_imm_p[row_0[7]].name });
    //   }
    // }
    // for (let fplb of lb_vil_p) {
    //   let current_district = await District.findOne({
    //     where: {
    //       name: fplb.district
    //     }
    //   });
    //   let _existing_plb = await PLB.findOne({
    //     where: { name: fplb.name, district: current_district.dataValues.id }
    //   });
    //   if (!_existing_plb) {
    //     await PLB.create({
    //       name: fplb.name,
    //       district: current_district.dataValues.id
    //     });
    //   }
    // }
    console.log(ward_list);
    let _non_existant = [];
    for (let district of Object.keys(ward_list)) {
      let gmpchyts = ward_list[district];
      gmpchyts.splice(gmpchyts.length - 1, 1);
      for (let pcht of gmpchyts) {
        // console.log(pcht[0]);
        let name = pcht[0].split(" ");
        if (
          [name[name.length - 2], name[name.length - 1]].join(" ") ==
          "District Panchayat"
        ) {
          continue;
        }
        if (
          [name[name.length - 2], name[name.length - 1]].join(" ") ==
          "Grama Panchayat"
        ) {
          name.splice(name.length - 2, 2);
        }
        name = name.join(" ").toUpperCase();
        console.log(name);
        let current_district = await District.findOne({
          where: {
            name: district.toUpperCase()
          }
        });
        let _existing_plb = await PLB.findOne({
          where: {
            name: name.toUpperCase(),
            district: current_district.dataValues.id
          }
        });
        if (!_existing_plb) {
          await PLB.create({
            name: name.toUpperCase(),
            ward_count: pcht[1],
            district: current_district.dataValues.id
          });
        }
      }
    }
    console.log(_non_existant);
  });
});
