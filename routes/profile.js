const express = require("express");
const {
  editProfile,
  getProfile,
} = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/authentication");
const router = express.Router();

router.get("/:userId", getProfile);

module.exports = router;
