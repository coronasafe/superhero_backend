const User = require("../models").user;
const Asset = require("../models").asset;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const Permissions = require("../constants/role_permission");
const AssetCategory = require("../models").asset_category;
const AssetManager = require("../models").asset_manager;
const ServiceRequest = require("../models").service_request;
const Sequelize = require("sequelize");
const MealRequest = require("../models").meal_request;
const FDC = require("../models").food_distribution_centre;
const FCMUtilities = require("../utils/fcm");
const moment = require("moment");
module.exports = {
  async newServiceRequest(req) {
    let {listAvailableUnits} = req.query;
    listAvailableUnits = listAvailableUnits === 'true';

    for (let field of [
      "category",
      "address_0",
      // "address_1",
      "location_0",
      // "location_1",
      "requested_unit_count",
      "group",
    ]) {
      if (req.body[field] == null)
        return ResponseTemplates.badRequestTemplate(
          `Mandatory field ${field} missing.`
        );
    }
    let filter = {};
    let attributes = {};
    if (req.body.category) {
      filter["category"] = req.body.category.toString();
    }
    const query_location = Sequelize.literal(
      `ST_GeomFromText('POINT(${req.body.location_0[1]} ${req.body.location_0[0]})')`
    );
    const query_distance = Sequelize.fn(
      //  postgis 2.2 name change ST_Distance_Sphere -> ST_DistanceSphere
      // TODO: before pushing to staging change this value since we are using pre 2.2 postgis
      "ST_Distance_Sphere",
      Sequelize.fn("ST_FlipCoordinates", Sequelize.col("location")),
      query_location
    );
    attributes["include"] = [[query_distance, "distance"]];
    // filter["manager"] = { $ne: null };
    filter = [
      {
        // List only units which updated location less than 3 hour ago
        updatedAt: {
          $gt: new Date(Date.now() - (60 * 60 * 1000 * 3)),
        }
      },
      filter,
      Sequelize.where(query_distance, {
        $lte: req.body.search_radius ? req.body.search_radius : 25,
      }),
    ];

    let assetManagerCondition = { current_service: null, state: req.user.state }
    // If API called by Panchayat user
    if (req.plb) {
      assetManagerCondition.plb = req.plb
    }

    // new change: dashboard can select users now. If we have a selected user, we will be fetching only one user
    if (!listAvailableUnits && req.body.units_to_notify) {
      filter = {
        id: req.body.units_to_notify
      }
    }

    let assets = await Asset.findAll({
      where: filter,
      limit: req.body.requested_unit_count
        ? Number.parseInt(req.body.requested_unit_count) + 9
        : 1,
      attributes: attributes,
      order: query_distance,
      include: [
        {
          model: AssetManager,
          as: "managerDetails",
          where: assetManagerCondition,
          required: true
        },
        {
          model: AssetCategory,
          as: "categoryDetails",
          where: { group: req.body.group },
          required: true,
        },
      ],
    }).catch((error) => {
      console.log(error);
    });
    // We are re-using the same API to list available units as well. So, if the dashboard wants to see the current units,
    // we push return the available units only else, we will be creating a new request
    if (listAvailableUnits) {
      return ResponseTemplates.dataTemplate(assets);
    }
    console.log("available assets: ", JSON.parse(JSON.stringify(assets)));
    // if (assets.length < req.body.requested_unit_count)
    //   return ResponseTemplates.errorTemplate(
    //     400,
    //     `Requested number of units unavailable. Only ${assets.length} units available`
    //   );
    if (assets.length < 1)
      return ResponseTemplates.errorTemplate(
        400,
        `No units available in your area.`
      );
    let managers_of_selected_assets = [];
    let push_tokens = [];
    for (let asset of assets) {
      for (let mgr of asset.dataValues.managerDetails) {
        managers_of_selected_assets.push(mgr.dataValues.id);
        let manager = await AssetManager.findOne({
          where: { id: mgr.dataValues.id },
        });
        if (manager && manager.dataValues.fcm_token)
          push_tokens.push(manager.dataValues.fcm_token);
      }
    }
    console.log("Notifying...", managers_of_selected_assets);
    if (push_tokens.length == 0)
      return ResponseTemplates.errorTemplate(
        400,
        "No users have valid FCM tokens"
      );
    let err = null;
    req.body["location_0"] = {
      type: "Point",
      coordinates: req.body["location_0"],
    };
    if (req.body["location_1"]) {
      req.body["location_1"] = {
        type: "Point",
        coordinates: req.body["location_1"],
      };
    }
    let response = await ServiceRequest.create({
      category: Number.parseInt(req.body.category),
      requestee: req.user.id,
      address_0: req.body.address_0,
      location_0: req.body.location_0,
      address_1: req.body.address_1,
      location_1: req.body.location_1,
      requested_unit_count: req.body.requested_unit_count,
      notified_units: managers_of_selected_assets,
      support_contact: req.body.support_contact,
      group: req.body.group,
      patient_name: req.body.patient_name,
      destination_contact: req.body.destination_contact,
      medical_info: req.body.medical_info,
      state : req.user.state
    }).catch(error => {
      console.log(error);
      err = "An error occured while creating new service request";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    let fcm_response = await FCMUtilities.sendToDevice(push_tokens, {
      // notification: {
      //   title: "Urgent Requirement",
      //   body: "Please Click This"
      // },
      data: {
        id: response.dataValues.id.toString(),
        category: req.body.category.toString(),
        requestee: req.user.id.toString(),
        address_0: req.body.address_0.toString(),
        location_0: req.body.location_0.toString(),
        requested_unit_count: req.body.requested_unit_count.toString(),
        support_contact: req.body.support_contact
          ? req.body.support_contact.toString()
          : "",
        patient_name: req.body.patient_name
          ? req.body.patient_name.toString()
          : "",
        destination_contact: req.body.destination_contact
          ? req.body.destination_contact.toString()
          : "",
        medical_info: req.body.medical_info
          ? req.body.medical_info.toString()
          : "",
        group: req.body.group.toString(),
        // notified_units: managers_of_selected_assets.toString()
      },
    });
    console.log(fcm_response);
    return ResponseTemplates.dataTemplate(response);
  },
  async expireServiceRequest(req) {
    if (!req.user) return ResponseTemplates.unAuthorizedRequestTemplate();
    let service_request = await ServiceRequest.findOne({
      where: { id: req.params.id },
    });
    if (!service_request)
      return ResponseTemplates.badRequestTemplate("Invalid request id.");
    let err = null;
    let response = await ServiceRequest.update(
      { active: false },
      { where: { id: service_request.dataValues.id } }
    ).catch((error) => {
      console.log(error);
      err = "An error occured while updating request status.";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
  async listServiceRequests(req) {
    if (!req.user) return ResponseTemplates.unAuthorizedRequestTemplate();
    let dataLimit = 70;
    let filter = {};
    if (!req.query["show_expired"]) {
      filter["active"] = true;
    }
    if (req.query["shifted_date"]) {
      filter = {
        ...filter,
        [Sequelize.Op.and]: [
          {
            completed_units: {
              [Sequelize.Op.ne]: null
            }
          },
          Sequelize.where(
              Sequelize.fn('date', Sequelize.col('service_request.createdAt')),
              '=', new Date(req.query["shifted_date"]).toLocaleDateString()
          )
        ]
      }
      dataLimit = null;
    }
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

    // If API called by Panchayat user
    if (req.plb) {
      filter.requestee = req.user.id
    }

    let response = await ServiceRequest.findAll({
      where: { ...filter, state: req.user.state },
      include: [
        { model: AssetCategory, as: "categoryDetails", where: category_filter },
      ],
      order: [["createdAt", "DESC"]],
      limit: dataLimit,
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async getServiceRequest(req) {
    if (!req.user) return ResponseTemplates.unAuthorizedRequestTemplate();
    let filter = {};
    // if (!req.query["show_expired"]) {
    //   filter["active"] = true;
    // }
    filter["id"] = req.params.id;
    let response = await ServiceRequest.findOne({
      where: filter,
      include: [{ model: AssetCategory, as: "categoryDetails" }],
    });
    if (response.dataValues.notified_units) {
      let notified_units = await AssetManager.findAll({
        where: { id: response.dataValues.notified_units },
      });
      response.dataValues["notifiedUnitDetails"] = notified_units;
    }
    if (response.dataValues.responded_units) {
      let responded_units = await AssetManager.findAll({
        where: { id: response.dataValues.responded_units },
      });
      response.dataValues["respondedUnitDetails"] = responded_units;
    }
    return ResponseTemplates.dataTemplate(response);
  },
  async newFoodDeliveryRequest(req) {
    const PACKETS_PER_VEHICLE = 25;
    let fdc = await FDC.findOne({ where: { id: req.params.id } });
    req.body["address_0"] = fdc.dataValues.address;
    req.body["location_0"] = fdc.dataValues.location;

    if (!fdc)
      return ResponseTemplates.badRequestTemplate(
        "Invalid distribution centre id."
      );
    for (let field of []) {
      if (!req.body[field])
        return ResponseTemplates.badRequestTemplate(
          `missing mandatory field ${field}.`
        );
    }
    req.body["group"] = 1;
    let filter = {};
    let attributes = {};
    // filter["category"] = req.body.category ? req.body.category : null;
    // const query_location = Sequelize.literal(
    //   `ST_GeomFromText('POINT(${req.body.location_0[1]} ${
    //     req.body.location_0[0]
    //   })')`
    // );
    // const query_distance = Sequelize.fn(
    //   "ST_Distance_Sphere",
    //   Sequelize.fn("ST_FlipCoordinates", Sequelize.col("location")),
    //   query_location
    // );
    // attributes["include"] = [[query_distance, "distance"]];
    // // filter["manager"] = { $ne: null };
    // filter = [
    //   {},
    //   filter,
    //   Sequelize.where(query_distance, {
    //     $lte: req.body.search_radius ? req.body.search_radius : 10000
    //   })
    // ];
    let assets = await Asset.findAll({
      where: filter,
      // limit: req.body.requested_unit_count ? req.body.requested_unit_count : 1,
      attributes: attributes,
      // order: query_distance,
      include: [
        {
          model: AssetManager,
          as: "managerDetails",
          where: { plb: fdc.dataValues.plb },
          required: true,
        },
        {
          model: AssetCategory,
          as: "categoryDetails",
          where: { group: req.body["group"] },
          required: true,
        },
      ],
    }).catch((error) => {
      console.log(error);
    });
    console.log("available assets: ", assets);
    // if (assets.length < req.body.requested_unit_count)
    //   return ResponseTemplates.errorTemplate(
    //     400,
    //     `Requested number of units unavailable. Only ${assets.length} units available`
    //   );
    if (assets.length < 1)
      return ResponseTemplates.errorTemplate(
        400,
        `No units available in your area.`
      );
    let available_asset_count = assets.length;
    let managers_of_selected_assets = [];
    let push_tokens = [];
    for (let asset of assets) {
      for (let mgr of asset.dataValues.managerDetails) {
        managers_of_selected_assets.push(mgr.dataValues.id);
        let manager = await AssetManager.findOne({
          where: { id: mgr.dataValues.id },
        });
        if (manager && manager.dataValues.fcm_token)
          push_tokens.push(manager.dataValues.fcm_token);
      }
    }
    let meal_requests;
    if (req.body.req_ids) {
      meal_requests = await MealRequest.findAll({
        where: {
          id: req.body.req_ids,
          fdc: req.params.id,
          delivered: false,
          requested: false,
        },
        attributes: { exclude: [] },
        group: ["ward", "id"],
      });
    } else {
      meal_requests = await MealRequest.findAll({
        where: { fdc: req.params.id, delivered: false, requested: false },
        attributes: { exclude: [] },
        group: ["ward", "id"],
      });
    }
    if (
      !meal_requests ||
      meal_requests.length == 0
      // meal_requests.length != req.body.req_ids.length
    )
      return ResponseTemplates.badRequestTemplate(
        "Invalid meal id(s) found in request"
      );
    let responses = [];
    let _pushed_mr = [];
    for (let asset of assets) {
      let ward = null;
      let plb = null;
      let destination_addresses = [];
      let PACKET_COUNT = 0;
      let mr_ids = [];
      for (let mr of meal_requests) {
        if (_pushed_mr.indexOf(mr.dataValues.id) != -1) continue;
        if (
          !mr.dataValues.ward ||
          !mr.dataValues.plb ||
          !mr.dataValues.district
        )
          return ResponseTemplates.errorTemplate(
            400,
            "One or more meal request does not have valid district ward or plb associated with it."
          );
        if (plb == null) plb = mr.dataValues.plb;
        if (plb != mr.dataValues.plb)
          return ResponseTemplates.badRequestTemplate(
            "Same request cannot contain orders from more than one Panchayat/Municipality"
          );
        if (!req.query.plb_broadcast) {
          if (ward == null) ward = mr.dataValues.ward;
          if (ward != mr.dataValues.ward)
            return ResponseTemplates.badRequestTemplate(
              "Same request cannot contain orders from more than one ward"
            );
        }
        console.log(
          "COUNTS:::::",
          PACKET_COUNT,
          PACKETS_PER_VEHICLE,
          Number.parseInt(PACKET_COUNT) +
            Number.parseInt(mr.dataValues.quantity)
        );
        if (
          Number.parseInt(PACKET_COUNT) +
            Number.parseInt(mr.dataValues.quantity) >
          PACKETS_PER_VEHICLE
        ) {
          break;
        } else {
          mr_ids.push(mr.dataValues.id);
          _pushed_mr.push(mr.dataValues.id);
          PACKET_COUNT += Number.parseInt(mr.dataValues.quantity);
          destination_addresses.push({
            id: mr.dataValues.id,
            name: mr.dataValues.name,
            address: mr.dataValues.address,
            landmark_address: mr.dataValues.landmark_address,
            landmark_location: mr.dataValues.landmark_location,
            phone: mr.dataValues.phone,
            quantity: mr.dataValues.quantity,
            batch_size: mr.dataValues.batch_size,
            batch_no: mr.dataValues.no_in_batch,
            delivered: false,
          });
        }
      }
      // filter["ward"] = ward;
      // // filter["district"]=district;
      // filter["plb"] = plb;

      console.log("Notifying...", managers_of_selected_assets);
      if (push_tokens.length == 0)
        return ResponseTemplates.errorTemplate(
          400,
          "No users have valid FCM tokens"
        );
      let err = null;
      // if (req.body["location_0"]) {
      //   req.body["location_0"] = {
      //     type: "Point",
      //     coordinates: req.body["location_0"]
      //   };
      // }
      //
      // if (req.body["location_1"]) {
      //   req.body["location_1"] = {
      //     type: "Point",
      //     coordinates: req.body["location_1"]
      //   };
      // }
      console.log("Location:\n\n\n", req.body.location_0);
      if (destination_addresses.length == 0) continue;
      let response = await ServiceRequest.sequelize
        .transaction(async (t) => {
          let sr_create_response = await ServiceRequest.create(
            {
              // category: Number.parseInt(req.body.category),
              // requestee: req.user.id,
              address_0: req.body.address_0,
              location_0: req.body.location_0,
              // address_1: req.body.address_1,
              // location_1: req.body.location_1,
              requested_unit_count: 1,
              notified_units: managers_of_selected_assets,
              support_contact: req.body.support_contact,
              destination_addresses: destination_addresses,
              group: req.body.group,
            },
            { transaction: t }
          );
          await MealRequest.update(
            {
              requested: true,
              service_request: sr_create_response.dataValues.id,
            },
            { where: { id: mr_ids }, transaction: t }
          );
          return sr_create_response;
        })
        .catch((error) => {
          console.log(error);
          err = "An error occured while creating new service request";
        });
      if (err) return ResponseTemplates.errorTemplate(400, err);
      console.log(response);
      let fcm_response = await FCMUtilities.sendToDevice(push_tokens, {
        // notification: {
        //   title: "Urgent Requirement",
        //   body: "Please Click This"
        // },
        data: {
          id: response.dataValues.id.toString(),
          category: "7",
          group: req.body.group.toString(),
          // requestee: req.user.id.toString(),
          address_0: req.body.address_0.toString(),
          location_0: req.body.location_0
            ? req.body.location_0.toString()
            : null,
          requested_unit_count: "1",
          support_contact: req.body.support_contact
            ? req.body.support_contact.toString()
            : "",
          destination_addresses: JSON.stringify(destination_addresses),
          // notified_units: managers_of_selected_assets.toString()
        },
      });
      console.log(fcm_response);
      responses.push(response);
    }
    return ResponseTemplates.dataTemplate(responses);
  },
  async cancelServiceRequest(req) {
    if (!req.user) return ResponseTemplates.unAuthorizedRequestTemplate();
    if (!req.body.units || !req.body.units.length > 0) {
      return ResponseTemplates.badRequestTemplate(
        "list of untis to be cancelled must be given."
      );
    }
    let service_req = await ServiceRequest.findOne({
      where: { id: req.params.id },
    });
    if (!service_req)
      return ResponseTemplates.errorTemplate(
        400,
        "An error occured while fetching the service request details."
      );
    let to_cancel = await AssetManager.findAll({
      where: { id: req.body.units },
    });
    if (to_cancel.length != req.body.units.length)
      return ResponseTemplates.errorTemplate(
        400,
        "one or more unit id provided is invalid."
      );
    let other_updates = {};
    let cancelled_units = [];
    let push_tokens = [];
    if (
      service_req.dataValues.cancelled_units &&
      service_req.dataValues.cancelled_units.length > 0
    ) {
      cancelled_units = [...service_req.dataValues.cancelled_units];
    }
    for (let unit of to_cancel) {
      cancelled_units.push(unit.dataValues.id);
      push_tokens.push(unit.dataValues.fcm_token);
    }
    if (
      service_req.dataValues.responded_units &&
      cancelled_units.length >= service_req.dataValues.responded_units.length
    ) {
      other_updates["active"] = false;
    }

    let err = null;
    let response = await AssetManager.sequelize
      .transaction(async (t) => {
        await ServiceRequest.update(
          {
            cancelled_units: cancelled_units,
            ...other_updates,
          },
          { where: { id: service_req.dataValues.id }, transaction: t }
        );
        return await AssetManager.update(
          { current_service: null },
          { where: { id: cancelled_units }, transaction: t }
        );
      })
      .catch((error) => {
        console.log(error);
        err =
          "An error occured while cancelling service. Please try again or contact support.";
      });
    if (err) return ResponseTemplates.errorTemplate(err);
    let fcm_response = await FCMUtilities.sendToDevice(push_tokens, {
      // notification: {
      //   title: "Request cancellation",
      //   body: "Your current service request has been cancelled. Please await for further instructions."
      // },
      data: {
        id: service_req.dataValues.id.toString(),
        cancelled: "true",
      },
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async notifyMoreUnits(req) {
    let service_req = await ServiceRequest.findOne({
      where: { id: req.params.id },
    });
    if (!service_req)
      return ResponseTemplates.badRequestTemplate(
        "cannot find service request"
      );
    let filter = {};
    let attributes = {};
    filter["category"] = service_req.dataValues.category;
    let location_0_coordinates = service_req.dataValues.location_0.coordinates;
    const query_location = Sequelize.literal(
      `ST_GeomFromText('POINT(${location_0_coordinates[1]} ${location_0_coordinates[0]})')`
    );
    const query_distance = Sequelize.fn(
      "ST_Distance_Sphere",
      Sequelize.fn("ST_FlipCoordinates", Sequelize.col("location")),
      query_location
    );
    attributes["include"] = [[query_distance, "distance"]];
    // filter["manager"] = { $ne: null };
    filter = [
      {
        // List only units which updated location less than 3 hour ago
        updatedAt: {
          $gt: new Date(Date.now() - (60 * 60 * 1000 * 3)),
        }
      },
      filter,
      Sequelize.where(query_distance, {
        $lte: req.body.search_radius ? req.body.search_radius : 25,
      }),
    ];
    let assets = await Asset.findAll({
      where: filter,
      // limit: req.body.requested_unit_count
      //   ? Number.parseInt(req.body.requested_unit_count) + 1
      //   : 1,
      limit: service_req.dataValues.notified_units
        ? service_req.dataValues.notified_units.length + 2
        : 2,
      attributes: attributes,
      order: query_distance,
      include: [
        {
          model: AssetManager,
          as: "managerDetails",
          required: true,
          where: {
            id: { $notIn: [...service_req.dataValues.notified_units] },
          },
        },
        {
          model: AssetCategory,
          as: "categoryDetails",
          where: { group: service_req.dataValues.group },
          required: true,
        },
      ],
    }).catch((error) => {
      console.log(error);
    });
    console.log("available assets: ", assets);
    // if (assets.length < req.body.requested_unit_count)
    //   return ResponseTemplates.errorTemplate(
    //     400,
    //     `Requested number of units unavailable. Only ${assets.length} units available`
    //   );
    if (assets.length < 1)
      return ResponseTemplates.errorTemplate(
        400,
        `No additional units available in your area.`
      );
    let managers_of_selected_assets = [];
    let push_tokens = [];
    for (let asset of assets) {
      for (let mgr of asset.dataValues.managerDetails) {
        managers_of_selected_assets.push(mgr.dataValues.id);
        let manager = await AssetManager.findOne({
          where: { id: mgr.dataValues.id },
        });
        if (manager && manager.dataValues.fcm_token)
          push_tokens.push(manager.dataValues.fcm_token);
      }
    }
    console.log("Notifying...", managers_of_selected_assets);
    if (push_tokens.length == 0)
      return ResponseTemplates.errorTemplate(
        400,
        "No users have valid FCM tokens"
      );
    let err = null;
    req.body["location_0"] = {
      type: "Point",
      coordinates: req.body["location_0"],
    };
    if (req.body["location_1"]) {
      req.body["location_1"] = {
        type: "Point",
        coordinates: req.body["location_1"],
      };
    }
    let response = await ServiceRequest.update(
      {
        notified_units: [
          ...service_req.dataValues.notified_units,
          ...managers_of_selected_assets,
        ],
      },
      { where: { id: service_req.dataValues.id } }
    ).catch((error) => {
      console.log(error);
      err = "An error occured while creating new service request";
    });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    let fcm_response = await FCMUtilities.sendToDevice(push_tokens, {
      // notification: {
      //   title: "Urgent Requirement",
      //   body: "Please Click This"
      // },
      data: {
        id: service_req.dataValues.id.toString(),
        category: service_req.dataValues.category.toString(),
        requestee: req.user.id.toString(),
        address_0: service_req.dataValues.address_0.toString(),
        location_0: service_req.dataValues.location_0.toString(),
        requested_unit_count: service_req.dataValues.requested_unit_count.toString(),
        support_contact: service_req.dataValues.support_contact
          ? service_req.dataValues.support_contact.toString()
          : "",
        group: service_req.dataValues.group.toString(),
        // notified_units: managers_of_selected_assets.toString()
      },
    });
    console.log(fcm_response);
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
};
