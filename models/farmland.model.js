// models/Farmland.js
const mongoose = require("mongoose");

const farmlandSchema = new mongoose.Schema({
  farmland: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "Enter a valid farmland name"],
  },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminModel",
  },
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],
  rejected: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],
  staffs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],

  livestocks: [
    {
      inCharge: {
        type: String,
      },
      breed: {
        type: String,
      },
      birthdate: {
        type: Date,
      },
      sex: {
        type: String,
        enum: ["Male", "Female"],
      },
      tagId: {
        type: String,
        required: true,
        trim: true,
        unique: true,
      },
      tagLocation: {
        type: String,
      },
      weight: {
        type: Number,
      },
      status: {
        type: String,
        enum: ["Healthy", "Sick", "Deceased"],
      },
      originStatus: {
        type: String,
        enum: ["Purchased", "Born on Farm"],
      },
      remark: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model("Farmlands", farmlandSchema);
