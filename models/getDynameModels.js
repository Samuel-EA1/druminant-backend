const mongoose = require("mongoose");
const livestockSchema = require("./livestock.model");
const quarantineSchema = require("./quarantine.model");
const financeSchema = require("./finance.model");

const getLivestockModel = (farmlandId, livestockType) => {
  const collectionName = `${farmlandId}_livestock_${livestockType}`;
  return mongoose.model(collectionName, livestockSchema, collectionName);
};

const getQuarantinedModel = (farmlandId, livestockType) => {
  const collectionName = `${farmlandId}_quarantined_${livestockType}`;
  return mongoose.model(collectionName, quarantineSchema, collectionName);
};

const getFinanceModel = (farmlandId, livestockType, financeType) => {
  const collectionName = `${farmlandId}_${livestockType}_finance_${financeType}`;
  return mongoose.model(collectionName, financeSchema, collectionName);
};

module.exports = {
  // livestock
  getLivestockModel,
  getQuarantinedModel,

  // finance
  getFinanceModel,
};
