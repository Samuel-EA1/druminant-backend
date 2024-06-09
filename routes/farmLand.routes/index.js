const express = require("express");
const router = express.Router();

const {
  updateLivestock,
  processFarmlandRequest,
  farmLandDetails,
  createLiveStock,
  getLivestock,
  deleteLivestock,
  getFarmlandStaffs,
  getFarmlandrequests,
  quarantine,
} = require("../../controllers/farmLand.controller");

// get a farmland
router.get("/:farmlandId", farmLandDetails);

// livestock routes
router
  .post("/:farmlandId/livestock", createLiveStock)
  .patch("/:farmlandId/livestock/:tagId", updateLivestock)
  .delete("/:farmlandId/livestock/:tagId", deleteLivestock)
  .get("/:farmlandId/livestock/:tagId", getLivestock)
  .post("/:farmlandId/livestock/:tagId", quarantine);

// farmland requests

router.post("/:farmlandId/staff/:staffId/process", processFarmlandRequest);
router.get("/:farmlandId/requests/accepted", getFarmlandStaffs);
router.get("/:farmlandId/requests/pending", getFarmlandrequests);

module.exports = router;
