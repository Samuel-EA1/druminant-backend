const express = require("express");
const router = express.Router();

const {
  createFarmland,
  farmLandDetails,
} = require("../../controllers/farmLand.controller");

router.post("/create", createFarmland).get("/:name", farmLandDetails);

module.exports = router;
