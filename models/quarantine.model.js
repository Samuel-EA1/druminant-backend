const mongoose = require("mongoose");

const quarantineSchema = new mongoose.Schema();

module.exports = mongoose.model("quarantine", quarantineSchema);
