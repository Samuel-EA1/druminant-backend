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
  createFinance,
  updateFinance,
  deleteFinance,
  getFinance,
  getAllLivestocks,
  getAllFinances,
} = require("../../controllers/farmLand.controller");

// get a farmland
router.get("/:farmlandId", farmLandDetails);

// livestock and quarantine routes
router
  .post("/:farmlandId/livestock/:livestockType", createLivestock)
  .patch("/:farmlandId/livestock/:livestockType/:livestockId", updateLivestock)
  .delete("/:farmlandId/livestock/:livestockType/:livestockId", deleteLivestock)
  .get("/:farmlandId/livestock/:livestockType/:livestockId", getLivestock)
  .get("/:farmlandId/livestock/:livestockType", getAllLivestocks)
  .post("/:farmlandId/livestock/:livestockType/:livestockId", quarantine);

// farmland requests
router.post("/:farmlandId/staff/:staffId/process", processFarmlandRequest);
router.get("/:farmlandId/requests/accepted", getFarmlandStaffs);
router.get("/:farmlandId/requests/pending", getFarmlandrequests);

// farmland finance

router
  .post("/:farmlandId/finance/:livestockType/:financeType", createFinance)
  .patch(
    "/:farmlandId/finance/:livestockType/:financeType/:financeId",
    updateFinance
  )
  .delete(
    "/:farmlandId/finance/:livestockType/:financeType/:financeId",
    deleteFinance
  )
  .get(
    "/:farmlandId/finance/:livestockType/:financeType/:financeId",
    getFinance
  )
  .get("/:farmlandId/finance/:livestockType/:financeType", getAllFinances);

module.exports = router;
