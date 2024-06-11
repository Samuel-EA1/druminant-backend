const mongoose = require("mongoose");
const livestockSchema = require("./livestock.model");
const quarantineSchema = require("./quarantine.model");
const financeSchema = require("./finance.model");
const eventSchema = require("./event.model");

const getLivestockModel = (farmlandId, livestockType) => {
  const collectionName = `${farmlandId}_${livestockType}_livestock`;
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
const getEventModel = (farmlandId, livestockType) => {
  const collectionName = `${farmlandId}_${livestockType}_event`;
  return mongoose.model(collectionName, eventSchema, collectionName);
};

module.exports = {
  getLivestockModel,
  getQuarantinedModel,
  getFinanceModel,
  getEventModel,
};
