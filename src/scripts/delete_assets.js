const AssetManager = require("../models").asset_manager;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const Permissions = require("../constants/role_permission");
const UserCategory = require("../models").user_category;
const AssetCategory = require("../models").asset_category;
const Asset = require("../models").asset;
const moment = require("moment");
let NO_DELETE = [
  "KL22M6072",
  "KL22M6158",
  "KL22M6109",
  "KL22M6184",
  "KL22M6128",
  "KL22M6148",
  "KL22M6142",
  "KL22M6143",
  "KL22M6089",
  "KL22M6149",
  "KL22M6335",
  "KL22M6117",
  "KL22M6178",
  "KL22M6177",
  "KL22M6071",
  "KL22M6171",
  "KL22M6332",
  "KL22M6394",
  "KL22M6332",
  "KL22M6377",
  "KL22M6439",
  "KL22M6427",
  "KL22M6415",
  "KL22M6328",
  "KL22M6398",
  "KL22M6413"
];
let DATE_FILTER = moment("2020-05-01");
async function DeleteAssets() {
  let assets = await Asset.findAll({
    where: {
      $or: {
        reg_no: NO_DELETE,
        createdAt: { $gt: DATE_FILTER }
      }
    }
  });
  let assetDetails = [];
  for (let asset of assets) {
    assetDetails.push({ reg_no: asset.dataValues.reg_no });
  }
  let no_delete_ids = [];
  for (let asset of assets) {
    no_delete_ids.push(asset.dataValues.id);
  }
  console.log(assetDetails);
  console.log(assetDetails.length, NO_DELETE.length, DATE_FILTER);
  let delete_candidates = await Asset.findAll({
    where: { id: { $notIn: no_delete_ids } }
  });
  assetDetails = [];
  let delete_candidate_ids = [];
  for (let asset of delete_candidates) {
    assetDetails.push({ reg_no: asset.dataValues.reg_no });
    delete_candidate_ids.push(asset.dataValues.id);
  }
  let total_asset_count = await Asset.count({});
  console.log(assetDetails, assetDetails.length, total_asset_count);
  let deleted = await Asset.sequelize
    .transaction(async t => {
      let manager_response = await AssetManager.destroy({
        where: { asset: delete_candidate_ids }
      });
      let asset_response = await Asset.destroy({
        where: { id: delete_candidate_ids }
      });
      console.log(manager_response, asset_response);
    })
    .catch(error => {
      console.log(error);
    });
  return true;
}
DeleteAssets();
