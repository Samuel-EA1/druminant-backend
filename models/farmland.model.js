// models/Farmland.js
const mongoose = require("mongoose");
const farmWorker = require("./staff.model");
const farmlandSchema = new mongoose.Schema({
  farmland: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "Enter a valid farmland name"],
  },
  // location: String,
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminModel",
  },
  staffs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],
});

module.exports = mongoose.model("Farmlands", farmlandSchema);
