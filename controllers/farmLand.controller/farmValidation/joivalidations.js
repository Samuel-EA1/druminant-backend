const Joi = require("joi");

// livestock
const joiLivestockSchema = Joi.object({
  breed: Joi.string().required(),
  birthdate: Joi.date().required(),
  sex: Joi.string().valid("Male", "Female").required(),
  tagId: Joi.string().trim().regex(/^\S+$/).required(),
  tagLocation: Joi.string().required(),
  weight: Joi.number().required(),
  status: Joi.string().valid("Healthy", "Sick", "Deceased").required(),
  originStatus: Joi.string().valid("Purchased", "Born on Farm").required(),
  remark: Joi.string().allow("").optional(),
});

// finance
const joiFinanceSchema = Joi.object({
  financeEntryId: Joi.string().trim().regex(/^\S+$/).required(),
  paymentmethod: Joi.string().valid("cash", "cheque", "transfer").required(),
  desc: Joi.string().allow("").optional(),
  transactionDate: Joi.date().required(),
  amount: Joi.number().required(),
});

// events

const joiEventSchema = Joi.object({
  eventEntryId: Joi.string().trim().regex(/^\S+$/).required(),
  remark: Joi.string().allow("").optional(),
  eventType: Joi.string().required(),
  eventDate: Joi.date().required(),
});

// Combined Joi Schema for Lactating Livestock including Milk Composition
const lactatingLivestockJoiSchema = Joi.object({
  entryLactationId: Joi.string().trim().required(),
  milkYield: Joi.number().required(),
  deliveryDate: Joi.date().required(),
  weight: Joi.number().required(),
  offspringNumber: Joi.number().required(),
  observation: Joi.string().required(),
  fat: Joi.number().required(),
  snf: Joi.number().required(), // Solid Not Fat
  lactose: Joi.number().required(),
  salt: Joi.number().required(),
  protein: Joi.number().required(),
  water: Joi.number().required(),
});

const pregnancyJoiSchema = Joi.object({
  breed: Joi.string().required(),
  entryPregnancyId: Joi.string().required(),
  status: Joi.string().valid("Yes", "No").required(),
  breedingDate: Joi.date().required(),
  gestationPeriod: Joi.number().integer().min(0).required(),
  ecd: Joi.date(),
  remark: Joi.string().optional().allow(""),
});

module.exports = {
  joiLivestockSchema,
  joiFinanceSchema,
  joiEventSchema,
  lactatingLivestockJoiSchema,
  pregnancyJoiSchema,
};
