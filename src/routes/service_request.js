const express = require("express");
const router = express.Router();
const serviceRequestController = require("../controllers/service_request");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");

router.post("/new", AuthController.verifyToken, async (req, res) => {
  const response = await serviceRequestController.newServiceRequest(req);
  respond(res, response.status, response);
});
router.post("/fdc/new/:id", async (req, res) => {
  const response = await serviceRequestController.newFoodDeliveryRequest(req);
  respond(res, response.status, response);
});
router.put(
  "/update/invalidate/:id",
  AuthController.verifyToken,
  async (req, res) => {
    const response = await serviceRequestController.expireServiceRequest(req);
    respond(res, response.status, response);
  }
);
router.get("/list", AuthController.verifyToken, async (req, res) => {
  const response = await serviceRequestController.listServiceRequests(req);
  respond(res, response.status, response);
});
router.get("/get/:id", AuthController.verifyToken, async (req, res) => {
  const response = await serviceRequestController.getServiceRequest(req);
  respond(res, response.status, response);
});
router.put("/cancel/:id", AuthController.verifyToken, async (req, res) => {
  const response = await serviceRequestController.cancelServiceRequest(req);
  respond(res, response.status, response);
});
router.put("/notify/more/:id", AuthController.verifyToken, async (req, res) => {
  const response = await serviceRequestController.notifyMoreUnits(req);
  respond(res, response.status, response);
});
// router.get("/list/category", async (req, res) => {
//   const response = await userController.listUserCategories(req);
//   respond(res, response.status, response);
// });
// router.put(
//   "/security/update/clearence/:id",
//   AuthController.verifyToken,
//   async (req, res) => {
//     const response = await userController.updateSecurityClearence(req);
//     respond(res, response.status, response);
//   }
// );
module.exports = router;
