const mongoose = require("mongoose");

const financeSchema = new mongoose.Schema(
  {
    inCharge: {
      type: String,
      required: true,
    },
    desc: {
      type: String,
    },
 

    paymentmethod: {
      type: String,
      enum: ["Cash", "Cheque", "Transfer"],
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
