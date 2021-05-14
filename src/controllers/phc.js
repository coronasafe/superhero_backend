const AssetManager = require("../models").asset_manager;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const PHCs = require("../datasets/phclist.json");
const cache = require("memory-cache");
module.exports = {
  async listPHCs(req) {
    let phcs_cache = cache.get("phcs");
    if (!phcs_cache) {
      for (let phc of PHCs) {
        phc[0] = null;
        phc[2] = null;
      }
      cache.put("phcs", PHCs, 3600000);
      return ResponseTemplates.dataTemplate(PHCs);
    } else {
      console.log("returning cached output");
      return ResponseTemplates.dataTemplate(phcs_cache);
    }
  }
};
