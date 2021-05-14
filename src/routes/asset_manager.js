const express = require("express");
const router = express.Router();
const assetManagerController = require("../controllers/asset_manager");
const assetController = require("../controllers/asset");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");

router.post("/create", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.createAssetManager(req);
  respond(res, response.status, response);
});

router.post("/signup", async (req, res) => {
  const response = await assetManagerController.signup(req);
  respond(res, response.status, response);
});
router.post("/login", async (req, res) => {
  const response = await assetManagerController.login(req);
  respond(res, response.status, response);
});
router.get("/list", async (req, res) => {
  const response = await assetManagerController.listAssetManagers(req);
  respond(res, response.status, response);
});
router.post("/register/asset", AuthController.verifyToken, async (req, res) => {
  const response = await assetController.createAsset(req);
  respond(res, response.status, response);
});
router.get("/profile", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.getProfile(req);
  respond(res, response.status, response);
});
router.put("/fcm", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.updateFCMToken(req);
  respond(res, response.status, response);
});
router.get("/request/active", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.getActiveServiceRequests(req);
  respond(res, response.status, response);
});
router.get("/request/accept/:id", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.acceptServiceRequest(req);
  respond(res, response.status, response);
});
router.get("/request/end/current", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.completeCurrentService(req);
  respond(res, response.status, response);
});
router.get("/request/pickup", AuthController.verifyToken, async (req, res) => {
  const response = await assetManagerController.markPickupReach(req);
  respond(res, response.status, response);
});
router.put("/reset/password", async (req, res) => {
  const response = await assetManagerController.resetPassword(req);
  respond(res, response.status, response);
});
module.exports = router;
