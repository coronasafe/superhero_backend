const express = require("express");
const router = express.Router();
// const userController = require("../controllers/user");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");
const mealRequestController = require("../controllers/meal_request");
router.get("/list", AuthController.verifyToken, async (req, res) => {
  const response = await mealRequestController.listMealRequests(req);
  respond(res, response.status, response);
});
router.get("/volunteer/list", AuthController.verifyToken, async (req, res) => {
  req.query["volunteer"] = req.user.id;
  const response = await mealRequestController.listMealRequests(req);
  respond(res, response.status, response);
});
router.get(
  "/mark/delivered/:id",
  AuthController.verifyToken,
  async (req, res) => {
    const response = await mealRequestController.markDelivered(req);
    respond(res, response.status, response);
  }
);
router.post("/register", AuthController.verifyToken, async (req, res) => {
  const response = await mealRequestController.registerMealRequest(req);
  respond(res, response.status, response);
});
router.get("/stats", async (req, res) => {
  const response = await mealRequestController.getStats(req.query);
  respond(res, response.status, response);
});
router.get("/:id", AuthController.verifyToken, async (req, res) => {
  const response = await mealRequestController.getMealRequest(req);
  respond(res, response.status, response);
});
module.exports = router;
