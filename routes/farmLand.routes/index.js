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
  getAllQuarantine,
  createLivestock,
  createFinance,
  updateFinance,
  deleteFinance,
  getFinance,
  getAllLivestocks,
  getAllFinances,
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getEvent,
  updateLactation,
  deleteLactation,
  getLactation,
  getAllLactations,
  createLactation,
  createPregnancy,
  updatePregnancy,
  deletePregnancy,
  getPregnancy,
  getAllPregnancies,
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
  .post("/:farmlandId/livestock/:livestockType/:livestockId", quarantine)
  .get("/:farmlandId/quarantine/:livestockType", getAllQuarantine);

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

// farmland event routes
router
  .post("/:farmlandId/event/:livestockType", createEvent)
  .patch("/:farmlandId/event/:livestockType/:eventId", updateEvent)
  .delete("/:farmlandId/event/:livestockType/:eventId", deleteEvent)
  .get("/:farmlandId/event/:livestockType/:eventId", getEvent)
  .get("/:farmlandId/event/:livestockType", getAllEvents);

// farmland lactation routes

router
  .post("/:farmlandId/lactation/:livestockType", createLactation)
  .patch("/:farmlandId/lactation/:livestockType/:lactationId", updateLactation)
  .delete("/:farmlandId/lactation/:livestockType/:lactationId", deleteLactation)
  .get("/:farmlandId/lactation/:livestockType/:lactationId", getLactation)
  .get("/:farmlandId/lactation/:livestockType", getAllLactations);

// livestock pregnancy check routes

router
  .post("/:farmlandId/pregnancy/:livestockType", createPregnancy)
  .get("/:farmlandId/pregnancy/:livestockType", getAllPregnancies)
  .patch("/:farmlandId/pregnancy/:livestockType/:pregnancyId", updatePregnancy)
  .delete("/:farmlandId/pregnancy/:livestockType/:pregnancyId", deletePregnancy)
  .get("/:farmlandId/pregnancy/:livestockType/:pregnancyId", getPregnancy);

module.exports = router;
