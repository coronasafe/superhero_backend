const User = require("../models").user;
const Asset = require("../models").asset;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const Permissions = require("../constants/role_permission");
const AssetCategory = require("../models").asset_category;
const AssetManager = require("../models").asset_manager;
const AssetGroup = require("../models").asset_group;
const District = require("../models").district;
const State = require("../models").state;
const SubDistrict = require("../models").sub_district;
const PLB = require("../models").plb;
const Sequelize = require("sequelize");
module.exports = {
  async getAssets(req) {
    if (!req.user) return ResponseTemplates.unAuthorizedRequestTemplate();


    let filter = {};
    let category_filter = {};
    if (req.query.role && req.query.role != "super") {
      if (req.query.role == "admin") {
        category_filter["group"] = [0];
      }
      if (req.query.role == "fdc_admin") {
        category_filter["group"] = [1];
      }
      if (req.query.role == "meds_admin") {
        category_filter["group"] = [2];
      }
      if (req.query.role == "o2_admin") {
        category_filter["group"] = [3];
      }
    }
    // if (req.manager) {
    //   filter["manager"] = req.manager.id;
    // }
    let attributes = {};
    if (req.query.category) {
      filter["category"] = req.query.category.split(",");
    }
    let user_clearence_level = req.user
      ? req.user.clearence_level
      : req.manager
      ? req.manager.clearence_level
      : 0;
    // filter["security_level"] = { $gte: user_clearence_level };
    let options = {};
    if (
      req.query.location_filter &&
      req.query.search_loc_lat &&
      req.query.search_loc_lng &&
      req.query.search_radius
    ) {
      console.log("sdkfsgjdlskfjgjfsdlkjg");
      const query_location = Sequelize.literal(
        `ST_GeomFromText('POINT(${req.query.search_loc_lng} ${req.query.search_loc_lat})')`
      );
      const query_distance = Sequelize.fn(
        "ST_Distance_Sphere",
        Sequelize.fn("ST_FlipCoordinates", Sequelize.col("location")),
        query_location
      );
      attributes["include"] = [[query_distance, "distance"]];
      filter = [
        {},
        filter,
        Sequelize.where(query_distance, {
          $lte: req.query.search_radius
        })
      ];
      options["order"] = [query_distance];
    } else {
      options["order"] = [["location_update_timestamp", "DESC NULLS LAST"]];
    }
    // request query type is string
    if (req.query.active === "true") {
      filter = {
        ...filter,
        [Sequelize.Op.and]: [
          Sequelize.literal(`location_update_timestamp > NOW() - INTERVAL '3h'`),
        ],
      }
    }

    let assetManagerCondition = { state: req.user.state }
    // If API called by Panchayat user
    if (req.plb) {
      assetManagerCondition.plb = req.plb
    }

    let response = await Asset.findAll({
      where: filter,
      limit: req.query.limit,
      attributes: attributes,
      include: [
        {
          model: AssetManager,
          as: "managerDetails",
          where: assetManagerCondition
        },
        { model: AssetCategory, as: "categoryDetails", where: category_filter }
      ],
      ...options
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async createAsset(req) {
    let err = null;
    for (let field of ["category", "name", "reg_no"]) {
      if (req.body[field] == null)
        return ResponseTemplates.badRequestTemplate(
          `Mandatory field ${field} missing.`
        );
    }
    req.body.reg_no.replace(/\W/g, "");
    req.body["reg_no"] = req.body["reg_no"].toUpperCase();
    let user_role = req.user ? req.user.role : null;
    // if (req.manager) {
    //   user_role = "asset_manager";
    //   req.body["manager"] = req.manager.id;
    // }
    if (
      !Permissions.checkPermission(user_role, [
        Permissions.constants.CREATE_ASSET
      ])
    )
      return ResponseTemplates.errorTemplate(
        400,
        "Your current role does not permit this action."
      );

    let category = await AssetCategory.findOne({
      where: { id: req.body.category }
    });
    req.body["security_level"] = category.dataValues.security_level;
    if (req.manager && category.dataValues.security_level > 2)
      return "You are not allowed to register an asset at this security level.";
    req.body["location"] = {
      type: "Point",
      coordinates: req.body["location"]
    };
    if (!category)
      return ResponseTemplates.errorTemplate(400, "Invalid asset category");
    let response = await Asset.create(req.body).catch(error => {
      console.log(error);
      err = "Error while creating assets";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
  async updateLocation(req) {
    let err = null;
    let asset = await Asset.findOne({ where: { id: req.params.id } });
    if (req.manager) {
      asset = await Asset.findOne({ where: { id: req.manager.asset } });
    }
    let user_clearence_level = req.user
      ? req.user.clearence_level
      : req.manager
      ? req.manager.clearence_level
      : 0;
    console.log(req.body.location);
    if (!asset) return ResponseTemplates.badRequestTemplate("Invalid asset ID");
    if (user_clearence_level < asset.dataValues.security_level) {
      return ResponseTemplates.errorTemplate(
        400,
        "You do not have the security clearence to perform this action"
      );
    }
    req.body["location"] = {
      type: "Point",
      coordinates: req.body["location"]
    };
    let response = await Asset.update(
      { location: req.body.location, location_update_timestamp: new Date() },
      { where: { id: asset.dataValues.id } }
    ).catch(error => {
      console.log(error);
      err = "An error occured while updating location of the asset.";
    });

    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response, {
      current_service: req.manager ? req.manager.current_service : null
    });
  },
  async listAssetCategories(req) {
    let filter = {};
    if (req.query.group) {
      filter["group"] = req.query.group;
    }
    let response = await AssetCategory.findAll({
      where: filter,
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async listAssetGroups(req) {
    let filter = {};
    if (req.query.role && req.query.role != "super") {
      if (req.query.role == "admin") {
        filter["id"] = [0];
      }
      if (req.query.role == "fdc_admin") {
        filter["id"] = [1];
      }
      if (req.query.role == "meds_admin") {
        filter["id"] = [2];
      }
      if (req.query.role == "o2_admin") {
        filter["id"] = [3];
      }
    }
    let response = await AssetGroup.findAll({
      where: filter,
      attributes: { exclude: ["createdAt", "updatedAt"] },
      include: [
        {
          model: AssetCategory,
          as: "categoryList",
          attributes: { exclude: ["createdAt", "updatedAt"] }
        }
      ]
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async listStates(req) {
    let response = await State.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async listDistricts(req) {
    let response = await District.findAll({
      attributes: { exclude: ["id", "createdAt", "updatedAt"] }
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async listSubDistricts(req) {
    let response = await SubDistrict.findAll({
      attributes: { exclude: ["id", "createdAt", "updatedAt"] },
      include: [
        {
          model: District,
          as: "districtDetails",
          attributes: { exclude: ["id", "createdAt", "updatedAt"] }
        }
      ]
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async listPLBs(req) {
    let filter = {};
    if (req.query.district) {
      let district = await District.findOne({
        where: { name: req.query.district.toUpperCase() }
      });
      if (!district)
        return ResponseTemplates.badRequestTemplate("District name error");
      filter["district"] = district.dataValues.id;
    }
    let response = await PLB.findAll({
      where: filter,
      attributes: { exclude: ["id", "createdAt", "updatedAt"] },
      include: [
        {
          model: District,
          as: "districtDetails",
          attributes: { exclude: ["id", "createdAt", "updatedAt"] }
        }
      ]
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async markAsReserved(req) {
    let err = null;
    let asset_manager = await AssetManager.findOne({
      where: { phone: req.query.phone }
    });
    if (!asset_manager || !asset_manager.dataValues.asset)
      return ResponseTemplates.badRequestTemplate("Invalid phone number");
    let response = await Asset.update(
      { reserved: true },
      { where: { id: asset_manager.dataValues.asset } }
    ).catch(error => {
      console.log(error);
      err = "An error occured while marking asset as reserved";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  }
  // async signUpAsAssetManager(req) {
  //   if (!req.body.phone || !req.body.password)
  //     return ResponseTemplates.badRequestTemplate(
  //       "Email and password are required fields"
  //     );
  //   for (let field of ["name", "category"]) {
  //     if (!req.body[field])
  //       return ResponseTemplates.errorTemplate(400, "Missing field " + field);
  //   }
  //   let err = null;
  //   if (
  //     !Permissions.checkPermission(req.user.role, [
  //       Permissions.constants.CREATE_ASSET
  //     ])
  //   )
  //     return ResponseTemplates.errorTemplate(
  //       400,
  //       "Your current role does not permit this action."
  //     );
  //
  //   let category = await AssetCategory.findOne({
  //     where: { id: req.body.category }
  //   });
  //   req.body["security_level"] = category.dataValues.security_level;
  //   req.body["location"] = {
  //     type: "Point",
  //     coordinates: req.body["location"]
  //   };
  //   if (!category)
  //     return ResponseTemplates.errorTemplate(400, "Invalid asset category");
  //   let response = await Asset.create(req.body).catch(error => {
  //     console.log(error);
  //     err = "Error while creating assets";
  //   });
  //   if (err) return ResponseTemplates.errorTemplate(400, err);
  //   return ResponseTemplates.dataTemplate(response);
  // }
};
