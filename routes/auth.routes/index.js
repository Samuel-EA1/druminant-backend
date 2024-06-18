const express = require("express");
const router = express.Router();

const  adminRegister = require("../../controllers/auth/admin.auth");
const  staffRegister  = require("../../controllers/auth/staff.auth");
const { login } = require("../../controllers/auth/login");
const {
  requestPasswordReset,
  resetPassword,
} = require("../../controllers/auth/resetPassword.auth");
 
// auth routes
router.post("/admin/register", adminRegister);
router.post("/staff/register", staffRegister);
router.post("/login", login);
router.post("/requestPasswordReset", requestPasswordReset);
router.post("/passwordReset", resetPassword);

module.exports = router;
