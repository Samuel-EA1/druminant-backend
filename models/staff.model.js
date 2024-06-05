const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const StaffSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["Pending", "Reject", "Accept"],
    default: "Pending",
  },

  staffAt: {
    type: String,
    trim: true,
  },

  username: {
    type: String,
    required: [true, "Please enter a username"],
    maxlength: [15, "Max username length is 15"],
    minlength: [3, "Min username length is 3"],
    unique: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [6, "Min password length is 6"],
    trim: true,
  },

  email: {
    type: String,
    required: [true, "Please  provide an email"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      "Invalid email address",
    ],
  },
});

StaffSchema.pre("save", async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

StaffSchema.methods.createJwt = function () {
  return jwt.sign(
    { isAdmin: this.isAdmin, id: this._id, username: this.username },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

// compare password
StaffSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Staffs", StaffSchema);
