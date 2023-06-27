const mongoose = require("mongoose");
const userModel = require("./User");
const { timeStamp } = require("console");

const jobSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: [true, "Pelase enter a company name"],
      trim: true,
    },

    position: {
      type: String,
      required: [true, "Please enter  position"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["interview", "declined", "pending"],
      default: "pending",
    },
    createdBy: {
      type: mongoose.Types.ObjectId,
      ref: "userModel",
      required: [true, "Please provide user"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Jobs", jobSchema);
