const express = require("express");
const router = express.Router();

const {
  createFarmland,
  processFarmlandRequest,
  farmLandDetails,
} = require("../../controllers/farmLand.controller");


router.post("/create", createFarmland).get("/:name", farmLandDetails);
router.post("/:farmlandId/staff/:staffId/process", processFarmlandRequest);

module.exports = router;
