const express = require("express");
const router = express.Router();
// const userController = require("../controllers/user");
const assetController=require("../controllers/asset");
const AuthController = require("../controllers/auth");
const respond = require("../utils/Responder");
const asset_manager = require("./asset_manager");
router.use("/manager",asset_manager);
router.get("/",AuthController.verifyToken,async(req,res)=>{
  const response = await assetController.getAssets(req);
  respond(res, response.status, response);
})
router.post("/create",AuthController.verifyToken,async(req,res)=>{
  const response = await assetController.createAsset(req);
  respond(res, response.status, response);
})
router.put("/update/location",AuthController.verifyToken,async(req,res)=>{
  const response = await assetController.updateLocation(req);
  respond(res, response.status, response);
})
router.put("/update/location/:id",AuthController.verifyToken,async(req,res)=>{
  const response = await assetController.updateLocation(req);
  respond(res, response.status, response);
})
router.get("/list/category",async(req,res)=>{
  const response = await assetController.listAssetCategories(req);
  respond(res, response.status, response);
})
router.get("/list/group",async(req,res)=>{
  const response = await assetController.listAssetGroups(req);
  respond(res, response.status, response);
})
router.get("/list/state",async(req,res)=>{
  const response = await assetController.listStates(req);
  respond(res, response.status, response);
})
router.get("/list/district",async(req,res)=>{
  const response = await assetController.listDistricts(req);
  respond(res, response.status, response);
})
router.get("/list/taluk",async(req,res)=>{
  const response = await assetController.listSubDistricts(req);
  respond(res, response.status, response);
})
router.get("/list/plb",async(req,res)=>{
  const response = await assetController.listPLBs(req);
  respond(res, response.status, response);
})
router.get("/mark/reserved",async(req,res)=>{
  const response = await assetController.markAsReserved(req);
  respond(res, response.status, response);
})
module.exports = router;
