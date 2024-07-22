const mongoose = require("mongoose");

// Define the combined lactating livestock schema with milk composition
const lactatingLivestockSchema = new mongoose.Schema(
  {
    tagId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: /^[a-zA-Z0-9]+$/,
    },
    milkYield: {
      type: Number,
      required: true,
    },
    deliveryDate: {
      type: Date,
      required: true,
    },
    weight: {
      type: Number,
      required: true,
    },
    offspringNumber: {
      type: Number,
      required: true,
    },
    observation: {
      type: String,
      required: true,
    },

    fat: {
      type: Number,
      required: true,
    },
    snf: {
      type: Number,
      required: true,
    },
    lactose: {
      type: Number,
      required: true,
    },
    salt: {
      type: Number,
      required: true,
    },
    protein: {
      type: Number,
      required: true,
    },
    water: {
      type: Number,
      required: true,
    },
    inCharge: {
      type: "string",
      require: true,
    },
  },
  { timestamps: true }
);

// Middleware to convert all string fields to lowercase before saving
lactatingLivestockSchema.pre("save", function (next) {
  for (let path in this.schema.paths) {
    if (this.schema.paths[path].instance === "String" && this[path]) {
      this[path] = this[path].toLowerCase();
    }
  }
  next();
});

module.exports = lactatingLivestockSchema;
