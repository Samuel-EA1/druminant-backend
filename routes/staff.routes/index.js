const express = require("express");
const router = express.Router();

const { login, register } = require("../../controllers/auth/staff.auth");

router.post("/register", register);

module.exports = router;
