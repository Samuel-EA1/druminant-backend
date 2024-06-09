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
  quarantines: [
    {
      quarantine_date: {
        type: Date,
        required: true,
      },

      reason: {
        type: String,
      },
      inCharge: {
        type: String,
        required: [true, "live stock InCharge is required"],
      },
      breed: {
        type: String,
        required: true,
      },
      birthdate: {
        type: Date,
        required: true,
      },
      sex: {
        type: String,
        enum: ["Male", "Female"],
        required: [true, "livestock sex is required"],
      },
      tagId: {
        type: String,
        required: true,
        unique: true,
      },
      tagLocation: {
        type: String,
        required: true,
      },
      weight: {
        type: Number,
        required: true,
      },
      status: {
        type: String,
        enum: ["Healthy", "Sick", "Deceased", "Pregnant", "Injured"],
        required: true,
      },
      originStatus: {
        type: String,
        enum: ["Purchased", "Born on Farm", "Donated", "Inherited", "Adopted"],
        required: true,
      },
      remark: {
        type: String,
      },
    },
  ],
});

module.exports = mongoose.model("Farmlands", farmlandSchema);
