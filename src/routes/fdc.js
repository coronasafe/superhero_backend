const express = require("express");
const router = express.Router();
// const userController = require("../controllers/user");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");
const FDCController = require("../controllers/fdc");
router.get("/list", AuthController.verifyToken, async (req, res) => {
  const response = await FDCController.listFDC(req);
  respond(res, response.status, response);
});
router.get("/get/:id", AuthController.verifyToken, async (req, res) => {
  const response = await FDCController.getFDC(req);
  respond(res, response.status, response);
});
router.post("/create", AuthController.verifyToken, async (req, res) => {
  const response = await FDCController.createFDC(req);
  respond(res, response.status, response);
});

module.exports = router;
