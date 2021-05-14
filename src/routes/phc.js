const express = require("express");
const router = express.Router();
// const userController = require("../controllers/user");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");
const PHCController = require("../controllers/phc");
router.get("/list", async (req, res) => {
  const response = await PHCController.listPHCs(req);
  respond(res, response.status, response);
});
module.exports = router;
