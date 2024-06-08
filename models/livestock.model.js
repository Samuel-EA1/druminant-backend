const mongoose = require("mongoose");

const LivestockSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("Livestock", LivestockSchema);
