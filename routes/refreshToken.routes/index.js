const express = require("express");
const refreshToken = require("../../controllers/auth/refreshToken.auth");
const router = express.Router();

router.post("/auth/refresh-token", refreshToken);

module.exports = router;
