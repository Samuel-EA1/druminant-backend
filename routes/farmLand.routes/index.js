const express = require("express");
const router = express.Router();

const {
  createFarmland,
  processFarmlandRequest,
  farmLandDetails,
  createLiveStock,
} = require("../../controllers/farmLand.controller");

// router.post("/create", createFarmland).get("/:name", farmLandDetails);

// livestock routes
router.post("/:farmlandId/livestock", createLiveStock);

router.post("/:farmlandId/staff/:staffId/process", processFarmlandRequest);

module.exports = router;
