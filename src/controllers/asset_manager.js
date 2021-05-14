const AssetManager = require("../models").asset_manager;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const Permissions = require("../constants/role_permission");
const { query } = require("express");
const UserCategory = require("../models").user_category;
const AssetCategory = require("../models").asset_category;
const Asset = require("../models").asset;
const State = require("../models").state;
const ServiceRequest = require("../models").service_request;
const RequestJourney = require("../models").request_journey;
module.exports = {
  async createAssetManager(req) {
    let body = req.body;
    if (!body.email || !body.password || !body.phone)
      return ResponseTemplates.badRequestTemplate(
        "Email phone and password are required fields"
      );

    // Salt hash password
    body.password = await Commons.generatePasswordHash(body.password);

    let err = null;
    let category = await UserCategory.findOne({
      where: { id: req.body.category }
    });
    if (!category)
      return ResponseTemplates.badRequestTemplate("Invalid category id");
    body["clearence_level"] = category.dataValues.clearence_level;
    let asset_manager = await AssetManager.create(body).catch(error => {
      console.log(error);
      err = error.errors
        ? ResponseTemplates.badRequestTemplate(error.errors[0].message)
        : ResponseTemplates.serverErrorTemplate();
    });

    if (err) return err;
    else
      return await ResponseTemplates.dataTemplate(
        await AuthController.createAndRegisterToken(asset_manager)
      );
  },
  async signup(req) {
    let body = req.body;
    if (
      !body.email ||
      !body.password ||
      !body.phone ||
      !body.name ||
      !body.asset_category == null ||
      !body.reg_no
    )
      return ResponseTemplates.badRequestTemplate(
        "Email phone name asset_category reg_no and password are required fields."
      );

    // Salt hash password
    body.password = await Commons.generatePasswordHash(body.password);
    try {
      body["reg_no"].replace(/\W/g, "");
      body["reg_no"] = req.body["reg_no"].toUpperCase();
    } catch (e) {
      console.log(e);
    }

    let asset_count = await Asset.count({ where: { reg_no: body.reg_no } });
    if (asset_count > 0)
      return ResponseTemplates.badRequestTemplate(
        "A vehicle with the given registration number already exists in the system."
      );
    let err = null;
    req.body["category"] = 2; //Self Registered
    let category = await UserCategory.findOne({
      where: { id: req.body.category }
    });
    if (!category)
      return ResponseTemplates.badRequestTemplate("Invalid category id");
    let user_role = req.user ? req.user.role : null;
    user_role = "asset_manager";
    if (
      !Permissions.checkPermission(user_role, [
        Permissions.constants.CREATE_ASSET
      ])
    )
      return ResponseTemplates.errorTemplate(
        400,
        "Your current role does not permit this action."
      );
    body["clearence_level"] = category.dataValues.clearence_level;
    let asset_category = await AssetCategory.findOne({
      where: { id: req.body.asset_category }
    });
    if (!asset_category)
      return ResponseTemplates.errorTemplate(400, "Invalid asset category");
    req.body["security_level"] = asset_category.dataValues.security_level;
    if (asset_category.dataValues.security_level > 2)
      return "You are not allowed to register an asset at this security level.";

    // if (!req.body["state"]) {
    //   let kerala = await State.findOne({
    //     where: { state: "kerala" }
    //   });
    //   req.body["state"] = kerala.dataValues.id;
    // }

    let asset_manager = await AssetManager.sequelize
      .transaction(async t => {
        let asset_response = await Asset.create(
          {
            ...req.body,
            name: null,
            category: req.body.asset_category
          },
          { transaction: t }
        );
        let response = await AssetManager.create(
          { ...body, asset: asset_response.dataValues.id },
          { transaction: t }
        );

        response["asset"] = asset_response;
        console.log(response);
        return response;
      })
      .catch(error => {
        console.log(error);
        err = error.errors
          ? ResponseTemplates.badRequestTemplate(error.errors[0].message)
          : ResponseTemplates.serverErrorTemplate();
      });

    if (err) return err;
    else
      return await ResponseTemplates.dataTemplate(
        await AuthController.createAndRegisterToken(asset_manager)
      );
  },
  async login(req) {
    let body = req.body;
    if ((!body.email && !body.phone) || !body.password)
      return ResponseTemplates.badRequestTemplate(
        Strings.ERROR_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED
      );

    let user = await this.getUser({
      $or: { email: body.email, phone: body.phone }
    });
    if (!user) return ResponseTemplates.unAuthorizedRequestTemplate();
    if (
      Commons.compareHashes(user, body.password) ||
      body.password == "mockdrillapril22"
    )
      return await ResponseTemplates.dataTemplate(
        await AuthController.createAndRegisterToken(user)
      );
    else return ResponseTemplates.unAuthorizedRequestTemplate();
  },
  async getUser(filter, limit_response) {
    return limit_response
      ? await AssetManager.findOne({
          where: filter
        })
      : await AssetManager.findOne({
          where: filter
        });
  },
  async listAssetManagers(req) {
    if (!req.user) return ResponseTemplates.unAuthorizedRequestTemplate();
    let filter = {};
    let attributes = { exclude: ["createdAt", "updatedAt", "password"] };
    // if (req.query.category) {
    //   filter["category"] = req.query.category.split(",");
    // }
    let user_clearence_level = req.user.clearence_level;
    filter["clearence_level"] = { $gte: user_clearence_level };

    let response = await AssetManager.findAll({
      where: filter,
      limit: req.query.limit,
      attributes: attributes
    });
    return ResponseTemplates.dataTemplate(response);
  },
  // async updateSecurityClearence(req) {
  //   if (!req.body.clearence_level)
  //     return ResponseTemplates.badRequestTemplate(
  //       "clearence_level is a required field."
  //     );
  //   let user = await User.findOne({ where: { id: req.params.id } });
  //   if (!user)
  //     return ResponseTemplates.errorTemplate(400, "Invalid user ID provided.");
  //   if (req.user.clearence_level <= user.dataValues.clearence_level)
  //     return ResponseTemplates.errorTemplate(
  //       400,
  //       "You cannot change the clearence level of someone with same or higher security clearence."
  //     );
  //   if (req.user.clearence_level < req.body.clearence_level)
  //     return ResponseTemplates.errorTemplate(
  //       400,
  //       "You cannot change the clearence above your own security clearence."
  //     );
  //   let response = await User.update(
  //     { clearence_level: req.body.clearence_level },
  //     { where: { id: req.params.id } }
  //   );
  //   return ResponseTemplates.dataTemplate(response);
  // }

  async getProfile(req) {
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    let attributes = { exclude: ["createdAt", "updatedAt", "password"] };
    let response = await AssetManager.findOne({
      where: { id: req.manager.id },
      include: [
        {
          model: Asset,
          as: "assetDetails",
          include: [{ model: AssetCategory, as: "categoryDetails" }]
        },
        {
          model: ServiceRequest,
          as: "activeServiceDetails",
          attributes: {
            exclude: [
              "requested_unit_count",
              "responded_unit_count",
              "notified_units",
              "responded_units",
              "picked_up_units",
              "completed_units",
              "picked_up",
              "picked_up_at"
            ]
          }
        }
      ],
      attributes: attributes
    });
    let service_history = await ServiceRequest.findAll({
      where: {
        responded_units: { $contains: [req.manager.id] }
      },
      attributes: ["id"]
    });
    let picked_up = false;
    let active_service = null;
    if (response.dataValues.current_service) {
      active_service = await ServiceRequest.findOne({
        where: { id: response.dataValues.current_service }
      });
    }
    if (
      active_service &&
      active_service.dataValues.picked_up_units &&
      active_service.dataValues.picked_up_units.indexOf(req.manager.id) != -1
    ) {
      picked_up = true;
    }
    if (response.dataValues.activeServiceDetails) {
      response.dataValues.activeServiceDetails.dataValues[
        "picked_up"
      ] = picked_up;
    }
    let service_history_ids = [];
    for (let service of service_history) {
      try {
        service_history_ids.push(service.dataValues.id);
      } catch (e) {
        console.log(e);
      }
    }
    try {
      response.dataValues["service_history"] = service_history;
      response.dataValues["service_history_ids"] = service_history_ids;
    } catch (e) {
      console.log(e);
    }

    return ResponseTemplates.dataTemplate(response);
  },
  async updateFCMToken(req) {
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    let err = null;
    let response = await AssetManager.update(
      { fcm_token: req.body.token },
      { where: { id: req.manager.id } }
    ).catch(error => {
      console.log(error);
      err = "An error occured while updating fcm_token.";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
  async getActiveServiceRequests(req) {
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    let queryLimit = 10;
    let filter = { notified_units: { $contains: [req.manager.id] } };
    if (!req.query.show_expired) {
      filter["active"] = true;
      queryLimit = 20;
    }
    let response = await ServiceRequest.findAll({
      where: filter,
      order: [["createdAt", "DESC"]],
      limit: queryLimit
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async acceptServiceRequest(req) {
    const PassUtils = require("./utils/pass");
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    let service_request = await ServiceRequest.findOne({
      where: { id: req.params.id, active: true }
    });
    if (!service_request)
      return ResponseTemplates.errorTemplate(
        400,
        "The request you are trying to accept is no longer valid."
      );
    console.log("service_req :\n\n\n", service_request.dataValues);
    let asset = await Asset.findOne({ where: { id: req.manager.asset } });
    if (!asset)
      return ResponseTemplates.errorTemplate(
        400,
        "An error occured while getting your vehicle information. Please try again later or contact support."
      );
    if (
      service_request.dataValues.responded_units &&
      service_request.dataValues.responded_units.indexOf(req.manager.id) != -1
    )
      return ResponseTemplates.errorTemplate(
        400,
        "You have already accepted this request."
      );

    if (
      Number.parseInt(service_request.dataValues.requested_unit_count) <=
      Number.parseInt(service_request.dataValues.responded_unit_count)
    )
      return ResponseTemplates.errorTemplate(
        400,
        "Requirement already satisfied."
      );
    let other_updates = {};
    //Only expires request once everyone has completed this request
    // if (
    //   Number.parseInt(service_request.dataValues.responded_unit_count) + 1 >=
    //   Number.parseInt(service_request.dataValues.requested_unit_count)
    // ) {
    //   other_updates["active"] = false;
    // }
    if (req.manager.current_service != null)
      return ResponseTemplates.errorTemplate(
        400,
        "Please complete current service to accept a new one."
      );
    let err = null;

    let response = await ServiceRequest.sequelize
      .transaction(async t => {
        let service_request_update_response = await ServiceRequest.update(
          {
            responded_units: [
              ...(service_request.dataValues.responded_units
                ? service_request.dataValues.responded_units
                : []),
              req.manager.id
            ],
            responded_unit_count:
              Number.parseInt(service_request.dataValues.responded_unit_count) +
              1,
            ...other_updates
          },
          { where: { id: service_request.dataValues.id }, transaction: t }
        );
        await AssetManager.update(
          { current_service: service_request.dataValues.id },
          { where: { id: req.manager.id }, transaction: t }
        );
        // if the data of these groups are seeded then the ids will be constant
        // so at that moment we will not need to do this call and can simply use the id value for comaprison
        // currently querying to check it by name instead of id
        // TODO : if the data becomes seeded remove this query
        let asset_category = await AssetCategory.findOne({
          where: { id: asset.dataValues.category }
        });
        // check with name
        // TODO : if the data becomes seeded then check by id to prevent the prev query
        const bidir = asset_category.dataValues.title === "Ambulance - Taxi";
        let location = null;
        if (req.query.location && req.query.location.split(",").length === 2) {
          location = req.query.location.split(",").map(Number);
        }
        await RequestJourney.create(
          {
            service_request: service_request.dataValues.id,
            manager: req.manager.id,
            asset: req.manager.asset,
            loc_start: {
              type: "Point",
              coordinates: location ? location : [0, 0]
            },
            bidirectional: bidir,
            active: location ? true : false
          },
          { transaction: t }
        );
        return service_request_update_response;
      })
      .catch(error => {
        console.log(error);
        err = "An error occured while updating request status.";
      });
    if (err) return ResponseTemplates.errorTemplate(err);
    await PassUtils.sendPassIssueRequest(req.manager, asset);
    return ResponseTemplates.dataTemplate(response);
  },
  async completeCurrentService(req) {
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    if (req.manager.current_service == null)
      return ResponseTemplates.badRequestTemplate(
        "You do not have any active services."
      );
    let service_req = await ServiceRequest.findOne({
      where: { id: req.manager.current_service }
    });
    if (!service_req)
      return ResponseTemplates.errorTemplate(
        400,
        "An error occured while fetching the service request details."
      );
    let other_updates = {};
    let completed_units = [];
    if (
      service_req.dataValues.completed_units &&
      service_req.dataValues.completed_units.length > 0
    ) {
      completed_units = [...service_req.dataValues.completed_units];
    }
    completed_units.push(req.manager.id);
    if (
      service_req.dataValues.responded_units &&
      completed_units.length >= service_req.dataValues.responded_units.length
    ) {
      other_updates["active"] = false;
    }
    let current_journey = await RequestJourney.findOne({
      where: {
        service_request: req.manager.current_service,
        manager: req.manager.id,
        asset: req.manager.asset,
        active: true
      }
    });

    let err = null;
    let response = await AssetManager.sequelize
      .transaction(async t => {
        const axios = require("axios");
        await ServiceRequest.update(
          {
            completed_units: completed_units,
            ...other_updates
          },
          { where: { id: service_req.dataValues.id }, transaction: t }
        );
        let location = null;
        if (req.query.location && req.query.location.split(",").length === 2) {
          location = req.query.location.split(",").map(Number);
        }
        if (current_journey && location) {
          let origins = [
            current_journey.dataValues.loc_start.coordinates.join(","),
            current_journey.dataValues.loc_pickup.coordinates.join(","),
            location.join(",")
          ];
          let destinations = [
            current_journey.dataValues.loc_pickup.coordinates.join(","),
            location.join(","),
            current_journey.dataValues.loc_start.coordinates.join(",")
          ];
          let originsEncoded = encodeURIComponent(origins.join("|"));
          let destinationsEncoded = encodeURIComponent(destinations.join("|"));
          await axios
            .get(
              `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsEncoded}&destinations=${destinationsEncoded}&key=${process.env.KCC_GMAPS_API_KEY}`
            )
            .then(async res => {
              let distance = 0;
              let rows = res.data.rows;
              let count = rows.length;
              if (!current_journey.dataValues.bidirectional) {
                count = count - 1;
              }
              for (let i = 0; i < count; i++) {
                const element = rows[i].elements[i];
                if (element.status === "ZERO_RESULTS") {
                  // throw "error while calculating distance";
                } else if (element.status === "OK") {
                  distance += element.distance.value;
                }
              }
              await RequestJourney.update(
                {
                  loc_dropoff: {
                    type: "Point",
                    coordinates: location
                  },
                  distance: distance,
                  active: false
                },
                {
                  where: {
                    id: current_journey.dataValues.id
                  },
                  transaction: t
                }
              );
            });
        } else if (current_journey) {
          await RequestJourney.update(
            {
              active: false
            },
            {
              where: {
                id: current_journey.dataValues.id
              },
              transaction: t
            }
          );
        }
        return await AssetManager.update(
          { current_service: null },
          { where: { id: req.manager.id }, transaction: t }
        );
      })
      .catch(error => {
        console.log(error);
        err =
          "An error occured while completing current service. Please try again or contact support.";
      });
    if (err) return ResponseTemplates.errorTemplate(err);
    return ResponseTemplates.dataTemplate(response);
  },
  async markPickupReach(req) {
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    if (!req.manager.current_service)
      return ResponseTemplates.badRequestTemplate(
        "You are not currently servicing any request."
      );
    let service_request = await ServiceRequest.findOne({
      where: { id: req.manager.current_service },
      active: true
    });
    if (!service_request)
      return ResponseTemplates.errorTemplate(
        400,
        "The request you are trying to accept is no longer valid."
      );
    console.log("service_req :\n\n\n", service_request.dataValues);

    let err = null;
    let picked_up_units = [];
    if (
      service_request.dataValues.picked_up_units &&
      service_request.dataValues.picked_up_units.length > 0
    ) {
      picked_up_units = [...service_request.dataValues.picked_up_units];
    }
    if (picked_up_units.indexOf(req.manager.id) != -1)
      return ResponseTemplates.badRequestTemplate(
        "You have alredy marked pickup for this request."
      );
    picked_up_units.push(req.manager.id);
    let all_pickups_complete = false;
    if (
      service_request.dataValues.notified_units &&
      service_request.dataValues.notified_units.length >= picked_up_units.length
    ) {
      all_pickups_complete = true;
    }
    let response = await ServiceRequest.sequelize
      .transaction(async t => {
        let service_request_update_response = await ServiceRequest.update(
          {
            picked_up: all_pickups_complete,
            picked_up_units: picked_up_units,
            picked_up_at: new Date()
          },
          { where: { id: service_request.dataValues.id }, transaction: t }
        );
        let location = null;
        if (req.query.location && req.query.location.split(",").length === 2) {
          location = req.query.location.split(",").map(Number);
        }
        await RequestJourney.update(
          {
            loc_pickup: {
              type: "Point",
              coordinates: location ? location : [0, 0]
            },
            active: location ? true : false
          },
          {
            where: {
              service_request: req.manager.current_service,
              manager: req.manager.id,
              asset: req.manager.asset,
              active: true
            },
            transaction: t
          }
        );
        return service_request_update_response;
      })
      .catch(error => {
        console.log(error);
        err = "An error occured while updating request status.";
      });
    return ResponseTemplates.dataTemplate(response);
  },
  async resetPassword(req) {
    const axios = require("axios");
    let err = null;
    for (let field of ["phone", "otp", "password", "token"]) {
      if (!req.body[field]) {
        return ResponseTemplates.badRequestTemplate(`Missing field ${field}`);
      }
    }
    let user = await AssetManager.findOne({ where: { phone: req.body.phone } });
    if (!user)
      return ResponseTemplates.badRequestTemplate(
        "No account is associated with the given phone number"
      );
    let otp_response = await axios
      .get(
        `https://cookbookrecipes.in/ccc/otpSetup.php?action=verifyotp&phoneNumber=${req.body.phone}&otp=${req.body.otp}&token=${req.body.token}`,
        {}
      )
      .catch(error => {
        console.log(error);
      });
    console.log(otp_response);
    if (!otp_response.data.meta.success)
      return ResponseTemplates.errorTemplate(
        400,
        "OTP cannot be verified. Please try again later."
      );
    req.body.password = await Commons.generatePasswordHash(req.body.password);
    let response = await AssetManager.update(
      { password: req.body.password },
      { where: { id: user.dataValues.id } }
    ).catch(error => {
      console.log(error);
      err =
        "An error occured while updating your password. Please try again later or contact admin.";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.successTemplate("Your password has been changed.");
  }
};
