const mongoose = require("mongoose");

// Define the combined lactating livestock schema with milk composition
const lactatingLivestockSchema = new mongoose.Schema(
  {
    entryLactationId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
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
      required: true, // Solid Not Fat
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
  },
  { timestamps: true }
);

module.exports = lactatingLivestockSchema 
