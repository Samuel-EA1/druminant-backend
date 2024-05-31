const express = require("express");
const editProfile = require("../controllers/profile.controller");
const router = express.Router();

router.patch("/:userId", editProfile);

module.exports = router;
