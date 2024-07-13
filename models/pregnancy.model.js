const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the Pregnancy schema
const pregnancySchema = new Schema({
  breed: {
    type: String,
    required: true,
  },
  tagId: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    enum: ["Yes", "No"],
    required: true,
  },
  breedingDate: {
    type: Date,
    required: true,
  },
  gestationPeriod: {
    type: Number,
    required: true,
    min: 0,
  },
  ecd: {
    type: Date,
    required: true,
    default: function () {
      return this.calculateECD();
    },
  },
  remark: {
    type: String,
    default: "",
  },
  inCharge: {
    type: String,
    required: true,
  },
});

// Method to calculate ECD
pregnancySchema.methods.calculateECD = function () {
  const breedingDate = this.breedingDate;
  const ecd = new Date(breedingDate);
  ecd.setDate(breedingDate.getDate() + this.gestationPeriod);
  return ecd;
};

// Middleware to set ECD before saving
pregnancySchema.pre("save", function (next) {
  this.ecd = this.calculateECD();
  next();
});

module.exports = pregnancySchema;
