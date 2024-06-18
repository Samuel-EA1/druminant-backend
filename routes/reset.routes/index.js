const express = require("express");
const {
  requestPasswordReset,
  resetPassword,
} = require("../../controllers/auth/resetPassword.auth");
const router = express.Router();

router.post("/requestPasswordReset", requestPasswordReset);
router.post("/passwordReset", resetPassword);

module.exports = router;
