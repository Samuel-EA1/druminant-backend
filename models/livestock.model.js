const mongoose = require("mongoose");

const livestockSchema = new mongoose.Schema(
  {
    inCharge: {
      type: String,
      required: true,
    },
    breed: {
      type: String,
      required: true,
    },
    birthDate: {
      type: Date,
      required: true,
    },
    sex: {
      type: String,
      enum: ["Male", "Female"],
      required: true,
    },
    tagId: {
      type: String,
      required: true,
      trim: true,
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
    origin: {
      type: String,
      enum: ["Born on farm", "Purchased", "Donated", "Inherited", "Adopted"],
      required: true,
    },
    remark: {
      type: String,
    },
  },
  { timestamps: true }
);


// Middleware to convert all string fields to lowercase before saving, excluding specified fields
livestockSchema.pre("save", function (next) {
  const excludeFields = ["origin", "status", "sex"];

  for (let path in this.schema.paths) {
    if (
      this.schema.paths[path].instance === "String" &&
      this[path] &&
      !excludeFields.includes(path)
    ) {
      this[path] = this[path].toLowerCase();
    }
  }
  next();
});

module.exports = livestockSchema;
