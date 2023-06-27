const mongoose = require("mongoose");
const bScript = require("bcryptjs");
const jwt = require("jsonwebtoken");
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter a name"],
    maxlength: 15,
    minlength: 3,
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      "Invalid email address",
    ],
  },

  password: {
    type: String,
    minlength: 6,
    required: [true, "Please enter an email"],
  },
});

UserSchema.pre("save", async function (next) {
  try {
    const salt = await bScript.genSalt(10);
    const hashPassword = await bScript.hash(this.password, salt);
    this.password = hashPassword;
  } catch (error) {
    console.log(error);
  }

  next();
});

UserSchema.methods.createJwt = function () {
  return jwt.sign({ id: this._id, name: this.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

// compare password
UserSchema.methods.comparePassword = function (password) {
  const isMatch = bScript.compare(password, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
