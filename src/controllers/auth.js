const jwt = require("jsonwebtoken");
const ResponseTemplates = require("../utils/ResponseTemplate");
const respond = require("../utils/Responder");
const Constants = require("../utils/Constants");
const User = require("../models").user;
const plbModel = require("../models").plb;
const AssetManager = require("../models").asset_manager;
module.exports = {
  async createAndRegisterToken(user) {
    let access_token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: 86400 * 20 // expires in 24 hours
    });
    return {
      access_token
    };
  },
  verifyToken(req, res, next) {
    var token = req.headers["x-access-token"];
    if (!token)
      return respond(
        res,
        Constants.RESPONSE_CODES.UN_AUTHORIZED,
        ResponseTemplates.unAuthorizedRequestTemplate()
      );

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      console.log(token, err);
      if (err)
        return respond(
          res,
          401,
          ResponseTemplates.unAuthorizedRequestTemplate()
        );
      // if everything good, save to request for use in other routes
      let asset_manager = await AssetManager.findOne({
        where: { id: decoded.id }
      });
      if (asset_manager) {
        req.manager = asset_manager;
        req.isAdmin = false;
        req.requestee = "manager";
      }
      let user = await User.find({
        where: { id: decoded.id }
      });
      if (user) {
        req.user = user;
        req.isAdmin = false;
        req.requestee = "user";
      }

      // Get details of panchayat if user is based on panchayat
      if (user && user.name && user.name.slice(0,3) === "pan") {
        const plbID = user.name.split('pan').pop().split('_')[0];
        let subDistrictDetails = await plbModel.find({
          where: { id: plbID }
        });
        req.plb = subDistrictDetails.name;
      } else {
        req.plb = null;
      }

      if (!asset_manager && !user) {
        return respond(
          res,
          Constants.RESPONSE_CODES.UN_AUTHORIZED,
          ResponseTemplates.unAuthorizedRequestTemplate()
        );
      }
      next();
    });
  },
  BlockEveryoneButSuper(req, res, next) {
    if (req.user.role != "super")
      return respond(
        res,
        Constants.RESPONSE_CODES.UN_AUTHORIZED,
        ResponseTemplates.unAuthorizedRequestTemplate()
      );
    next();
  }
};
