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
const ExpireRequests = async () => {
  return await ServiceRequest.update(
    { active: false },
    {
      where: { group: 0, createdAt: { $lte: moment().subtract(12, "hours") } }
    }
  ).catch(error => {
    console.log(error);
  });
};

const ScheduleAutoExpire = () => {
  const schedule = require("node-schedule");
  schedule.scheduleJob("* */2 * * *", async function() {
    console.log("Initiating auto expire...");
    await ExpireRequests();
  });
};
module.exports = { ScheduleAutoExpire };
