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
    trim: true,
    unique: true,
    match: /^[a-zA-Z0-9]+$/,
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

 


// Middleware to convert all string fields to lowercase before saving, excluding specified fields
pregnancySchema.pre("save", function (next) {
  const excludeFields = ["status"];

  for (let path in this.schema.paths) {
    if (
      this.schema.paths[path].instance === "String" &&
      this[path] &&
      !excludeFields.includes(path)
    ) {
      this[path] = this[path].toLowerCase();
    }
  }
  this.ecd = this.calculateECD();
  next();
});

module.exports = pregnancySchema;
