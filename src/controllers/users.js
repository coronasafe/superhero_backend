const User = require("../models").user;
const Strings = require("../utils/Strings");
const ResponseTemplates = require("../utils/ResponseTemplate");
const Commons = require("../utils/Commons");
const AuthController = require("../controllers/auth");
const Permissions = require("../constants/role_permission");
const UserCategory = require("../models").user_category;
module.exports = {
  async createUser(body) {
    if (!body.email || !body.password || !body.phone||!body.state)
      return ResponseTemplates.badRequestTemplate(
        "Email phone  password and state are required fields"
      );

    // Salt hash password
    body.password = await Commons.generatePasswordHash(body.password);

    let err = null;
    let category = await UserCategory.findOne({
      where: { id: body.category }
    });
    if (!category)
      return ResponseTemplates.badRequestTemplate("Invalid category id");
    body["clearence_level"] = category.dataValues.clearence_level;
    let user = await User.create(body).catch(error => {
      console.log(error);
      err = error.errors
        ? ResponseTemplates.badRequestTemplate(error.errors[0].message)
        : ResponseTemplates.serverErrorTemplate();
    });

    if (err) return err;
    else
      return await ResponseTemplates.dataTemplate(
        await AuthController.createAndRegisterToken(user)
      );
  },
  async login(body) {
    if ((!body.email && !body.phone) || !body.password)
      return ResponseTemplates.badRequestTemplate(
        Strings.ERROR_MESSAGES.EMAIL_AND_PASSWORD_REQUIRED
      );

    let user = await this.getUser({
      $or: { email: body.email, phone: body.phone }
    });
    if (!user) return ResponseTemplates.unAuthorizedRequestTemplate();
    let token = await AuthController.createAndRegisterToken(user);
    if (Commons.compareHashes(user, body.password))
      return await ResponseTemplates.dataTemplate({
        ...user.dataValues,
        access_token: token.access_token
      });
    else return ResponseTemplates.unAuthorizedRequestTemplate();
  },
  async getUser(filter, limit_response) {
    return limit_response
      ? await User.find({
          where: filter
        })
      : await User.find({
          where: filter
        });
  },
  async listUserCategories(req) {
    let response = await UserCategory.findAll({
      attributes: { exclude: ["createdAt", "updatedAt"] }
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async listUsers(req) {
    let filter = {};
    let attributes = { exclude: ["createdAt", "updatedAt", "password"] };
    if (req.query.category) {
      filter["category"] = req.query.category.split(",");
    }
    let user_clearence_level = req.user.clearence_level;
    filter["clearence_level"] = { $gte: user_clearence_level };

    let response = await User.findAll({
      where: filter,
      limit: req.query.limit,
      attributes: attributes
    });
    return ResponseTemplates.dataTemplate(response);
  },
  async updateSecurityClearence(req) {
    if (!req.body.clearence_level)
      return ResponseTemplates.badRequestTemplate(
        "clearence_level is a required field."
      );
    let user = await User.findOne({ where: { id: req.params.id } });
    if (!user)
      return ResponseTemplates.errorTemplate(400, "Invalid user ID provided.");
    if (req.user.clearence_level <= user.dataValues.clearence_level)
      return ResponseTemplates.errorTemplate(
        400,
        "You cannot change the clearence level of someone with same or higher security clearence."
      );
    if (req.user.clearence_level < req.body.clearence_level)
      return ResponseTemplates.errorTemplate(
        400,
        "You cannot change the clearence above your own security clearence."
      );
    let response = await User.update(
      { clearence_level: req.body.clearence_level },
      { where: { id: req.params.id } }
    );
    return ResponseTemplates.dataTemplate(response);
  },
  async getUserFromToken(req) {
    let response = await User.findOne({ where: { id: req.user.id } });
    return ResponseTemplates.dataTemplate(response);
  },
  async volunteerSignup(req) {
    let body = req.body;
    if (!body.name || !body.password || !body.phone)
      return ResponseTemplates.badRequestTemplate(
        "Name phone and password are required fields"
      );
    req.body["category"] = 3;
    req.body["role"] = "fdc_volunteer";
    // Salt hash password
    body.password = await Commons.generatePasswordHash(body.password);

    let err = null;
    let category = await UserCategory.findOne({
      where: { id: body.category }
    });
    if (!category)
      return ResponseTemplates.badRequestTemplate("Invalid category id");
    body["clearence_level"] = category.dataValues.clearence_level;
    let _existing = await User.count({
      where: { phone: body.phone, role: req.body.role }
    });
    if (_existing > 0)
      return ResponseTemplates.badRequestTemplate("User already exist.");
    let user = await User.create(body).catch(error => {
      console.log(error);
      err = error.errors
        ? ResponseTemplates.badRequestTemplate(error.errors[0].message)
        : ResponseTemplates.serverErrorTemplate();
    });
    let token = await AuthController.createAndRegisterToken(user);
    if (err) return err;
    else
      return await ResponseTemplates.dataTemplate({
        ...user.dataValues,
        access_token: token.access_token
      });
  },
  async resetPassword(req) {
    const axios = require("axios");
    let err = null;
    for (let field of ["phone", "otp", "password"]) {
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
        `https://cookbookrecipes.in/ccc/otpSetup.php?action=verifyotp&phoneNumber=${req.body.phone}&otp=${req.body.otp}&token=token`,
        {}
      )
      .catch(error => {
        console.log(error);
      });
    console.log(otp_response);
    return;
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
    return ResponseTemplates.dataTemplate(response);
  }
};
