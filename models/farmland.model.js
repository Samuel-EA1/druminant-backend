// models/Farmland.js
const mongoose = require("mongoose");

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
  requests: [
    {
      type: String,
      ref: "Staffs",
    },
  ],
  rejected: [
    {
      type: String,
      ref: "Staffs",
    },
  ],
  staffs: [
    {
      type: String,
      ref: "Staffs",
    },
  ],
});

module.exports = mongoose.model("Farmlands", farmlandSchema);
