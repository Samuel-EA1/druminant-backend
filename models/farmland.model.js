// models/Farmland.js
const mongoose = require("mongoose");

const farmlandSchema = new mongoose.Schema({
  farmland: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "Enter a valid farmland name"],
  },

  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "adminModel",
  },
  requests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],
  rejected: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],
  staffs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staffs",
    },
  ],
});


// Middleware to convert all string fields to lowercase before saving
farmlandSchema.pre("save", function (next) {
  for (let path in this.schema.paths) {
    if (this.schema.paths[path].instance === "String" && this[path]) {
      this[path] = this[path].toLowerCase();
    }
  }
  next();
});

module.exports = mongoose.model("Farmlands", farmlandSchema);
