const express = require("express");
const router = express.Router();

const {
  updateLivestock,
  processFarmlandRequest,
  farmLandDetails,
  createLiveStock,
} = require("../../controllers/farmLand.controller");

// get a farmland
router.get("/:farmlandId", farmLandDetails);

// livestock routes
router
  .post("/:farmlandId/livestock", createLiveStock)
  .patch("/:farmlandId/livestock/:tagId",updateLivestock);

router.post("/:farmlandId/staff/:staffId/process", processFarmlandRequest);

module.exports = router;
