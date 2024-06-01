const express = require("express");
const {
  editProfile,
  getProfile,
} = require("../controllers/profile.controller");
const router = express.Router();

router.patch("/:userId", editProfile).get("/:userId", getProfile);

module.exports = router;
