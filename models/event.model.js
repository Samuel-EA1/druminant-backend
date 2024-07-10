const { required } = require("joi");
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    inCharge: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
    },

    tagId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    eventDate: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = eventSchema;
