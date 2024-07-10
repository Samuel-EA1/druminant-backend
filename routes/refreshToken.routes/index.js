const express = require("express");
const refreshToken = require("../../controllers/auth/refreshToken.auth");
const router = express.Router();

router.post("/refresh-token", refreshToken);

module.exports = router;
