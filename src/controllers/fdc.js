const AssetManager = require("../models").asset_manager;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const Permissions = require("../constants/role_permission");
const UserCategory = require("../models").user_category;
const AssetCategory = require("../models").asset_category;
const Asset = require("../models").asset;
const ServiceRequest = require("../models").service_request;
const FDC = require("../models").food_distribution_centre;
const LBValidator = require("./utils/local_body_validator");
const MealRequest = require("../models").meal_request;
module.exports = {
  async createFDC(req) {
    let err = null;
    for (let field of [
      "name",
      "address",
      "location",
      "district",
      "plb",
      "ward"
    ]) {
      if (!req.body[field])
        return ResponseTemplates.badRequestTemplate(
          `Missing mandatory field ${field}`
        );
    }
    let district = await LBValidator.getValidDistrict(req.body["district"]);
    if (!district)
      return ResponseTemplates.badRequestTemplate("invalid district name.");
    let plb = await LBValidator.getValidPLB(
      req.body["plb"],
      req.body["district"]
    );
    if (!plb)
      return ResponseTemplates.badRequestTemplate(
        "invalid primary local body name."
      );
    if (req.body.location) {
      req.body.location = {
        type: "Point",
        coordinates: req.body["location"]
      };
    }
    let response = await FDC.create({
      ...req.body,
      district: district.dataValues.name,
      plb: plb.dataValues.name
    }).catch(error => {
      console.log(error);
      err =
        "An error occured while creating fdc. Please try again or contact admin.";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
  async listFDC(req) {
    let filter = {};
    if (req.query.district) {
      filter["district"] = req.query.district;
      if (req.query.plb) {
        filter["plb"] = req.query.plb;
      }
    }
    let err = null;
    let response = await FDC.findAll({ where: filter });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
  async getFDC(req) {
    let filter = {};
    filter["id"] = req.params.id;
    let err = null;
    let response = await FDC.findOne({
      where: filter,
      include: [{ model: MealRequest, as: "requestDetails" }]
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  }
};
