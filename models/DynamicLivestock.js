const mongoose = require('mongoose')
const livestockSchema = require("./livestock.model");
const quarantineSchema = require("./quarantine.model");


const getLivestockModel = (farmlandId, livestockType) => {
  const collectionName = `${farmlandId}_livestock_${livestockType}`;
  return mongoose.model(collectionName, livestockSchema, collectionName);
};

const getQuarantinedModel = (farmlandId, livestockType) => {
  const collectionName = `${farmlandId}_quarantined_${livestockType}`;
  return mongoose.model(collectionName, quarantineSchema, collectionName);
};

module.exports = {
  getLivestockModel,
  getQuarantinedModel,
};
