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
const MealRequest = require("../models").meal_request;
const District = require("../models").district;
const Panchayath = require("../models").plb;
const Sequelize = require("sequelize");
const LBValidator = require("./utils/local_body_validator");
const { v4 } = require("uuid");
function makeid(length) {
  var result = "";
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}
module.exports = {
  async registerMealRequest(req) {
    let err = null;
    for (let field of [
      "name",
      "phone",
      "address",
      "landmark_address",
      "landmark_location",
      "district",
      "plb",
      "ward",
      "quantity",
    ]) {
      if (!req.body[field])
        return ResponseTemplates.badRequestTemplate(
          `Missing mandatory field ${field}`
        );
    }
    let district = await LBValidator.getValidDistrict(req.body["district"]);
    try {
      req.body["quantity"] = Number.parseInt(req.body["quantity"]);
    } catch (e) {
      console.log(e);
      return ResponseTemplates.badRequestTemplate(
        "quantity must be a valid number."
      );
    }
    if (Number.isNaN(req.body["quantity"]))
      return ResponseTemplates.badRequestTemplate(
        "quantity must be a valid number."
      );
    try {
      req.body["kids_count"] = Number.parseInt(req.body["kids_count"]);
      req.body["seniors_count"] = Number.parseInt(req.body["seniors_count"]);
      if (Number.isNaN(req.body["kids_count"])) {
        delete req.body.kids_count;
      }
      if (Number.isNaN(req.body["seniors_count"])) {
        delete req.body.seniors_count;
      }
    } catch (e) {
      console.log(e);
      req.body["kids_count"] = 0;
      req.body["seniors_count"] = 0;
    }

    if (!district)
      return ResponseTemplates.badRequestTemplate("invalid district name.");
    let plb = await LBValidator.getValidPLB(
      req.body["plb"],
      req.body["district"]
    );
    req.body["order_id"] = makeid(6);
    if (!plb)
      return ResponseTemplates.badRequestTemplate(
        "invalid primary local body name."
      );
    if (req.body.landmark_location) {
      req.body.landmark_location = {
        type: "Point",
        coordinates: req.body["landmark_location"],
      };
    }
    let fdcs = await FDC.findAll({
      where: {
        district: district.dataValues.name,
        plb: plb.dataValues.name,
        ward: req.body.ward,
      },
      include: [{ model: MealRequest, as: "requestDetails" }],
    });
    if (!fdcs || fdcs.length === 0) {
      fdcs = await FDC.findAll({
        where: { district: district.dataValues.name, plb: plb.dataValues.name },
        include: [{ model: MealRequest, as: "requestDetails" }],
      });
    }
    if (!fdcs || fdcs.length === 0)
      return ResponseTemplates.errorTemplate(
        400,
        "there are no fdcs in your ward or panchayat."
      );
    let active_request_assoc = [];
    for (let dc of fdcs) {
      active_request_assoc.push({
        id: dc.dataValues.id,
        count: dc.dataValues.requestDetails
          ? dc.dataValues.requestDetails.length
          : 0,
      });
    }
    let candidate = active_request_assoc[0];
    for (let arc of active_request_assoc) {
      if (arc.count < candidate.count) {
        candidate = arc;
      }
    }
    const MAX_REQ_QTY = 20;
    if (req.body.quantity <= MAX_REQ_QTY) {
      let response = await MealRequest.create({
        ...req.body,
        district: district.dataValues.name,
        plb: plb.dataValues.name,
        fdc: candidate.id,
        volunteer: req.user.id,
      }).catch((error) => {
        console.log(error);
        err = "An error occured while creating request";
      });
      if (err) return ResponseTemplates.errorTemplate(400, err);
      return ResponseTemplates.dataTemplate(response);
    } else {
      let data = [];
      let uid = v4();
      let QTNT = req.body.quantity / MAX_REQ_QTY;
      let RMDR = req.body.quantity % MAX_REQ_QTY;
      for (let step = 0; step < Math.floor(QTNT); step++) {
        data.push({
          ...req.body,
          district: district.dataValues.name,
          plb: plb.dataValues.name,
          fdc: candidate.id,
          volunteer: req.user.id,
          quantity: MAX_REQ_QTY,
          batch_id: uid,
          no_in_batch: step + 1,
          batch_size: Math.ceil(QTNT),
        });
      }
      if (RMDR && RMDR > 0) {
        data.push({
          ...req.body,
          district: district.dataValues.name,
          plb: plb.dataValues.name,
          fdc: candidate.id,
          volunteer: req.user.id,
          quantity: RMDR,
          batch_id: uid,
          no_in_batch: Math.ceil(QTNT),
          batch_size: Math.ceil(QTNT),
        });
      }
      let response = await MealRequest.bulkCreate(data).catch((error) => {
        console.log(error);
        err = "An error occured while creating request";
      });
      if (err) return ResponseTemplates.errorTemplate(400, err);
      return ResponseTemplates.dataTemplate(response);
    }
  },
  async listMealRequests(req) {
    let err = null;
    let filter = {};
    if (req.query.district) {
      filter["district"] = req.query.district.toUpperCase().split(",");
    }
    if (req.query.plb) {
      if (!req.query.district)
        return ResponseTemplates.badRequestTemplate(
          "plb filter must be accompanied by district."
        );
      filter["district"] = req.query.district.toUpperCase().split(",");
      filter["plb"] = req.query.plb.toUpperCase().split(",");
    }
    if (req.query.ward) {
      if (!req.query.district || !req.query.plb)
        return ResponseTemplates.badRequestTemplate(
          "plb filter must be accompanied by district plb."
        );
      filter["district"] = req.query.district.toUpperCase().split(",");
      filter["plb"] = req.query.plb.toUpperCase().split(",");
      filter["ward"] = req.query.ward.toUpperCase().split(",");
    }
    if (req.query.volunteer) {
      filter["volunteer"] = req.query.volunteer;
    }
    let response = await MealRequest.findAll({
      where: { ...filter },
      attributes: { exclude: ["aadhar_no"] },
      order: [["createdAt", "DESC"]],
    });
    let m_reqs = [];
    for (let rsp of response) {
      if (
        m_reqs.length > 0 &&
        m_reqs[m_reqs.length - 1].dataValues.batch_id ==
          rsp.dataValues.batch_id &&
        rsp.dataValues.batch_id != null
      ) {
        m_reqs[m_reqs.length - 1].dataValues.quantity =
          Number.parseInt(m_reqs[m_reqs.length - 1].dataValues.quantity) +
          Number.parseInt(rsp.dataValues.quantity);
      } else {
        m_reqs.push(rsp);
      }
    }
    return ResponseTemplates.dataTemplate(m_reqs);
  },
  async getMealRequest(req) {
    let err = null;
    let filter = { id: req.params.id };

    let response = await MealRequest.findOne({
      where: { ...filter },
      attributes: { exclude: ["aadhar_no"] },
      include: [{ model: FDC, as: "FDCDetails" }],
    });
    if (response) {
      let batch = await MealRequest.findAll({
        where: {
          id: { $ne: response.dataValues.id },
          batch_id: response.dataValues.batch_id,
        },
      });
      let qty = 0;
      for (let item of batch) {
        qty += Number.parseInt(item.dataValues.quantity);
      }
      response.dataValues.quantity =
        Number.parseInt(response.dataValues.quantity) + qty;
    }
    return ResponseTemplates.dataTemplate(response);
  },
  async markDelivered(req) {
    if (!req.manager) return ResponseTemplates.unAuthorizedRequestTemplate();
    if (!req.manager.current_service)
      return ResponseTemplates.badRequestTemplate(
        "You do not have any active service."
      );
    let service_request = await ServiceRequest.findOne({
      where: { id: req.manager.current_service },
    });
    let meal_request = await MealRequest.findOne({
      where: { id: req.params.id },
    });
    try {
      for (let address of service_request.dataValues.destination_addresses) {
        if (address.id == meal_request.dataValues.id) {
          address["delivered"] = true;
        }
      }
    } catch (e) {
      console.log(e);
    }
    let err = null;
    let response = await ServiceRequest.sequelize
      .transaction(async (t) => {
        let update_response = await ServiceRequest.update(
          {
            destination_addresses:
              service_request.dataValues.destination_addresses,
          },
          { where: { id: service_request.dataValues.id } }
        );
        await MealRequest.update(
          { delivered: true },
          { transaction: t, where: { id: meal_request.dataValues.id } }
        );
        let rsp = await ServiceRequest.findOne({
          where: { id: service_request.dataValues.id },
        });
        return rsp;
      })
      .catch((error) => {
        console.log(error);
        err = "an error occured while updating delivery status.";
      });
    if (err) return ResponseTemplates.errorTemplate(400, err);
    return ResponseTemplates.dataTemplate(response);
  },
  async getStats({ district, panchayath, fdc, ward, from, to }) {
    let districtFilter = {};
    let mealsFilter = {};
    if (from && !to) {
      mealsFilter.createdAt = {
        [Sequelize.Op.gte]: from,
      };
    } else if (from && to) {
      mealsFilter.createdAt = {
        [Sequelize.Op.between]: [from, to],
      };
    } else if (to) {
      mealsFilter.createdAt = {
        [Sequelize.Op.lte]: to,
      };
    }
    if (district) {
      districtFilter.name = district.toUpperCase();
      if (panchayath) {
        mealsFilter.plb = panchayath.toUpperCase();
        if (fdc) {
          mealsFilter.fdc = fdc;
        } else if (ward) {
          mealsFilter.ward = ward;
        }
      }
    }
    let allRequests = await District.findAll({
      where: { ...districtFilter },
      include: [
        mealsFilter.plb
          ? {
              model: MealRequest,
              as: "mealRequests",
              where: { ...mealsFilter },
              include: [
                { model: FDC, as: "FDCDetails" },
                { model: ServiceRequest, as: "serviceRequestDetails" },
              ],
            }
          : {
              model: MealRequest,
              as: "mealRequests",
              include: [
                { model: FDC, as: "FDCDetails" },
                { model: ServiceRequest, as: "serviceRequestDetails" },
              ],
            },
      ],
    });
    let stats = {
      requested: 0,
      packets: 0,
      notified: 0,
      delivered: 0,
      pending: 0,
      responded_units: 0,
      entity_wise_distribution: {},
      ward_wise_distribution: {},
    };
    allRequests.forEach((item) => {
      stats.requested += item.mealRequests.length;
      stats.packets += item.mealRequests
        .map((meal) => {
          return meal.quantity;
        })
        .reduce(function (a, b) {
          return a + b;
        }, 0);
      stats.notified += item.mealRequests.filter((meal) => {
        return meal.requested;
      }).length;
      stats.delivered += item.mealRequests.filter((meal) => {
        return meal.delivered;
      }).length;
      stats.pending = stats.requested - stats.delivered;
      item.mealRequests.forEach((mealRequest) => {
        let title =
          mealsFilter.ward || mealsFilter.fdc
            ? mealRequest.landmark_address
            : mealsFilter.plb
            ? mealRequest.FDCDetails.name
            : districtFilter.name
            ? mealRequest.plb
            : mealRequest.district;
        if (mealsFilter.plb) {
          stats.ward_wise_distribution[mealRequest.ward] = stats
            .ward_wise_distribution[mealRequest.ward]
            ? {
                requested:
                  stats.ward_wise_distribution[mealRequest.ward].requested + 1,
                packets:
                  stats.ward_wise_distribution[mealRequest.ward].packets +
                  mealRequest.quantity,
                notified:
                  stats.ward_wise_distribution[mealRequest.ward].notified +
                  (mealRequest.requested ? 1 : 0),
                crew_notified:
                  stats.ward_wise_distribution[mealRequest.ward].crew_notified +
                  (mealRequest.serviceRequestDetails
                    ? mealRequest.serviceRequestDetails.notified_units.length
                    : 0),
                delivered:
                  stats.ward_wise_distribution[mealRequest.ward].delivered +
                  (mealRequest.delivered ? 1 : 0),
                pending:
                  stats.ward_wise_distribution[mealRequest.ward].pending +
                  (!mealRequest.delivered ? 1 : 0),
                responded_units:
                  stats.ward_wise_distribution[mealRequest.ward].pending +
                  (mealRequest.serviceRequestDetails &&
                  mealRequest.serviceRequestDetails.responded_units
                    ? mealRequest.serviceRequestDetails.responded_units.length
                    : 0),
                fdc: mealRequest.fdc,
              }
            : {
                requested: 1,
                packets: mealRequest.quantity,
                crew_notified: mealRequest.serviceRequestDetails
                  ? mealRequest.serviceRequestDetails.notified_units.length
                  : 0,
                notified: mealRequest.requested ? 1 : 0,
                delivered: mealRequest.delivered ? 1 : 0,
                pending: !mealRequest.delivered ? 1 : 0,
                responded_units:
                  mealRequest.serviceRequestDetails &&
                  mealRequest.serviceRequestDetails.responded_units
                    ? mealRequest.serviceRequestDetails.responded_units.length
                    : 0,
                fdc: mealRequest.fdc,
              };
        }
        stats.entity_wise_distribution[title] = stats.entity_wise_distribution[
          title
        ]
          ? {
              requested: stats.entity_wise_distribution[title].requested + 1,
              packets:
                stats.entity_wise_distribution[title].packets +
                mealRequest.quantity,
              crew_notified:
                stats.entity_wise_distribution[title].crew_notified +
                (mealRequest.serviceRequestDetails
                  ? mealRequest.serviceRequestDetails.notified_units.length
                  : 0),
              notified:
                stats.entity_wise_distribution[title].notified +
                (mealRequest.requested ? 1 : 0),
              delivered:
                stats.entity_wise_distribution[title].delivered +
                (mealRequest.delivered ? 1 : 0),
              pending:
                stats.entity_wise_distribution[title].pending +
                (!mealRequest.delivered ? 1 : 0),
              responded_units:
                stats.entity_wise_distribution[title].responded_units +
                (mealRequest.serviceRequestDetails &&
                mealRequest.serviceRequestDetails.responded_units
                  ? mealRequest.serviceRequestDetails.responded_units.length
                  : 0),
              fdc: mealRequest.fdc,
            }
          : {
              requested: 1,
              packets: mealRequest.quantity,
              crew_notified: mealRequest.serviceRequestDetails
                ? mealRequest.serviceRequestDetails.notified_units.length
                : 0,
              notified: mealRequest.requested ? 1 : 0,
              delivered: mealRequest.delivered ? 1 : 0,
              pending: !mealRequest.delivered ? 1 : 0,
              responded_units:
                mealRequest.serviceRequestDetails &&
                mealRequest.serviceRequestDetails.responded_units
                  ? mealRequest.serviceRequestDetails.responded_units.length
                  : 0,
              fdc: mealRequest.fdc,
            };
      });
    });
    return ResponseTemplates.dataTemplate(stats);
  },
};
