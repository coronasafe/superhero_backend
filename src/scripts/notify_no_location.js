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
const moment = require("moment");
const FCMUtilities = require("../utils/fcm");
const NotifyNoLocationUpdate = async () => {
  let filter = {};
  filter["location_update_timestamp"] = {
    $lt: moment().subtract(3, "hours")
  };
  let assets = await Asset.findAll({
    where: filter,
    include: [{ model: AssetManager, as: "managerDetails", required: true }]
  }).catch(error => {
    console.log(error);
  });
  let managers_of_selected_assets = [];
  let push_tokens = [];
  for (let asset of assets) {
    for (let mgr of asset.dataValues.managerDetails) {
      console.log("Name :", mgr.name);
      managers_of_selected_assets.push(mgr.dataValues.id);
      if (mgr.dataValues.fcm_token) push_tokens.push(mgr.dataValues.fcm_token);
    }
  }
  console.log("NO LOCATION LOG : ", managers_of_selected_assets, push_tokens);
  let fcm_response = await FCMUtilities.sendToDevice(push_tokens, {
    notification: {
      title: "We have trouble updating your location.",
      body:
        "Please open the app and make sure you have location permissions enabled."
    }
    // data: {
    //   id: response.dataValues.id.toString(),
    //   category: req.body.category.toString(),
    //   requestee: req.user.id.toString(),
    //   address_0: req.body.address_0.toString(),
    //   location_0: req.body.location_0.toString(),
    //   requested_unit_count: req.body.requested_unit_count.toString(),
    //   support_contact: req.body.support_contact
    //     ? req.body.support_contact.toString()
    //     : "",
    //   group: req.body.group.toString()
    // notified_units: managers_of_selected_assets.toString()
    // }
  });
  console.log(fcm_response);
  return true;
};

const ScheduleNoLocationNotify = () => {
  const schedule = require("node-schedule");
  schedule.scheduleJob("*/30 */2 * * *", async function() {
    console.log("Initiating no location notify...");
    await NotifyNoLocationUpdate();
  });
};
module.exports = { ScheduleNoLocationNotify };
