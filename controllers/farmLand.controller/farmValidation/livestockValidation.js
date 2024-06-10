const Joi = require("joi");

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

module.exports = joiLivestockSchema;
