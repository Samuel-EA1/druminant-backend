const express = require("express");
const router = express.Router();

const {
  updateLivestock,
  processFarmlandRequest,
  farmLandDetails,
  getLivestock,
  deleteLivestock,
  getFarmlandStaffs,
  getFarmlandrequests,
  quarantine,
  createLivestock,
} = require("../../controllers/farmLand.controller");

// get a farmland
router.get("/:farmlandId", farmLandDetails);

// livestock routes
router
  .post("/:farmlandId/livestock/:livestockType", createLivestock)
  .patch("/:farmlandId/livestock/:livestockType/:livestockId", updateLivestock)
  .delete("/:farmlandId/livestock/:livestockType/:livestockId", deleteLivestock)
  .get("/:farmlandId/livestock/:livestockType/:livestockId", getLivestock)
  .post("/:farmlandId/livestock/:livestockType/:livestockId", quarantine);

// farmland requests
router.post("/:farmlandId/staff/:staffId/process", processFarmlandRequest);
router.get("/:farmlandId/requests/accepted", getFarmlandStaffs);
router.get("/:farmlandId/requests/pending", getFarmlandrequests);

module.exports = router;
