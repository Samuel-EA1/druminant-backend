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

module.exports = { joiLivestockSchema, joiFinanceSchema, joiEventSchema };
