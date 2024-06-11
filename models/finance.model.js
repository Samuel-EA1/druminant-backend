const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema(
  {
    inCharge: {
      type: String,
      required: true,
    },
    remark: {
      type: String,
    },
    financeEntryId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },

    paymentmethod: {
      type: String,
      enum: ["cash", "cheque", "transfer"],
      required: true,
    },

    transactionDate: {
      type: Date,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = financeSchema;
