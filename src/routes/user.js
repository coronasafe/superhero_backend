const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");

router.get("/list", AuthController.verifyToken, async (req, res) => {
  const response = await userController.listUsers(req);
  respond(res, response.status, response);
});
router.get("/profile", AuthController.verifyToken, async (req, res) => {
  const response = await userController.getUserFromToken(req);
  respond(res, response.status, response);
});
router.get("/list/category", async (req, res) => {
  const response = await userController.listUserCategories(req);
  respond(res, response.status, response);
});
router.post("/volunteer/fdc/signup", async (req, res) => {
  const response = await userController.volunteerSignup(req);
  respond(res, response.status, response);
});
router.put(
  "/security/update/clearence/:id",
  AuthController.verifyToken,
  async (req, res) => {
    const response = await userController.updateSecurityClearence(req);
    respond(res, response.status, response);
  }
);
module.exports = router;
