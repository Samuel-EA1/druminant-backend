const mongoose = require("mongoose");

const livestockSchema = new mongoose.Schema(
  {
    inCharge: {
      type: String,
      required: true,
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
      required: true,
    },
    tagId: {
      type: String,
      required: true,
      trim: true,
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
      enum: ["Healthy", "Sick", "Deceased"],
      required: true,
    },
    originStatus: {
      type: String,
      enum: ["Purchased", "Born on Farm"],
      required: true,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = livestockSchema;
