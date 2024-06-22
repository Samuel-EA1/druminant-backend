const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const AdminSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: true,
  },
  adminAt: {
    type: String,
    trim: true,
    unique: true,
  },

  farmland: {
    type: String,
    trim: true,
    set: (value) => value.replace(/\s+/g, ""),
  },

  username: {
    type: String,
    required: [true, "Please enter a username"],
    maxlength: [15, "Max username length is 15"],
    minlength: [3, "Min username length is 3"],
    unique: true,
  },
  password: {
    type: String,
    required: [true, "Please enter a password"],
    minlength: [6, "Min password length is 6"],
  },
  email: {
    type: String,
    required: [true, "Please enter a valid email address"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      "Please provide a valid email address",
    ],
  },
});

// Encrypt password before saving the admin document
AdminSchema.pre("save", async function (next) {
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

// Create JWT token for Admin
AdminSchema.methods.createJwt = function () {
  return jwt.sign(
    {
      id: this._id,
      isAdmin: this.isAdmin,
      username: this.username,
      farmland: this.farmland,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

// Method to compare given password with the hashed password in the database
AdminSchema.methods.comparePassword = async function (candidatePassword) {
  console.log(` From DB ${this.password}`);
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("Admins", AdminSchema);
