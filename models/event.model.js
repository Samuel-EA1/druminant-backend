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
      match: /^[a-zA-Z0-9]+$/,
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

// Middleware to convert all string fields to lowercase before saving
eventSchema.pre("save", function (next) {
  for (let path in this.schema.paths) {
    if (this.schema.paths[path].instance === "String" && this[path]) {
      this[path] = this[path].toLowerCase();
    }
  }
  next();
});

module.exports = eventSchema;
