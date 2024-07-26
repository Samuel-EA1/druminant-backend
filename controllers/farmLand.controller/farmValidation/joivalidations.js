const Joi = require("joi");

// Livestock Schema
const joiLivestockSchema = Joi.object({
  breed: Joi.string().required().messages({
    "any.required": "Breed is required.",
    "string.base": "Breed must be a string.",
    "string.empty": "Breed cannot be empty.",
  }),
  birthDate: Joi.date().required().allow(null).messages({
    "any.required": "Birth date is required.",
    "date.base": "Birth date must be a valid date.",
    "date.empty": "Birth date cannot be empty.",
    "date.null": "Birth date cannot be null.",
  }),
  sex: Joi.string().valid("Male", "Female").required().messages({
    "any.required": "Sex is required.",
    "any.only": "Sex must be either Male or Female.",
  }),
  tagId: Joi.string().trim().alphanum().required().messages({
    "any.required": "Tag ID is required.",
    "string.alphanum": "Tag ID must be alphanumeric.",
    "string.empty": "Tag ID cannot be empty.",
  }),
  tagLocation: Joi.string().required().messages({
    "any.required": "Tag location is required.",
    "string.base": "Tag location must be a string.",
    "string.empty": "Tag location cannot be empty.",
  }),
  weight: Joi.number().required().messages({
    "any.required": "Weight is required.",
    "number.base": "Weight must be a number.",
  }),
  status: Joi.string()
    .valid("Healthy", "Sick", "Deceased", "Pregnant", "Injured")
    .required()
    .messages({
      "any.required": "Status is required.",
      "any.only":
        "Status must be one of Healthy, Sick, Deceased, Pregnant, or Injured.",
    }),
  origin: Joi.string()
    .valid("Born on farm", "Purchased", "Donated", "Inherited", "Adopted")
    .required()
    .messages({
      "any.required": "Origin is required.",
      "any.only":
        "Origin must be one of Born on farm, Purchased, Donated, Inherited, or Adopted.",
    }),
  remark: Joi.string().allow("").optional(),
});

// Finance Schema
const joiFinanceSchema = Joi.object({
  paymentmethod: Joi.string()
    .valid("Cash", "Cheque", "Transfer")
    .required()
    .messages({
      "any.required": "Payment method is required.",
      "any.only": "Payment method must be one of Cash, Cheque, or Transfer.",
    }),
  desc: Joi.string().required().messages({
    "any.required": "Description is required.",
    "string.base": "Description must be a string.",
    "string.empty": "Description cannot be empty.",
  }),
  transactionDate: Joi.date().required().allow(null).messages({
    "any.required": "Transaction date is required.",
    "date.base": "Transaction date must be a valid date.",
    "date.empty": "Transaction date cannot be empty.",
    "date.null": "Transaction date cannot be null.",
  }),
  amount: Joi.number().required().messages({
    "any.required": "Amount is required.",
    "number.base": "Amount must be a number.",
  }),
});

// Event Schema
const joiEventSchema = Joi.object({
  tagId: Joi.string().trim().alphanum().required().messages({
    "string.alphanum": "Tag ID must be alphanumeric.",
    "string.empty": "Tag ID cannot be empty.",
  }),
  remark: Joi.string().allow("").optional(),
  eventType: Joi.string().required().messages({
    "any.required": "Event type is required.",
    "string.base": "Event type must be a string.",
    "string.empty": "Event type cannot be empty.",
  }),
  eventDate: Joi.date().required().allow(null).messages({
    "any.required": "Event date is required.",
    "date.base": "Event date must be a valid date.",
    "date.empty": "Event date cannot be empty.",
    "date.null": "Event date cannot be null.",
  }),
});

// Lactating Livestock Schema
const lactatingLivestockJoiSchema = Joi.object({
  tagId: Joi.string().trim().alphanum().required().messages({
    "any.required": "Tag ID is required.",
    "string.alphanum": "Tag ID must be alphanumeric.",
    "string.empty": "Tag ID cannot be empty.",
  }),
  milkYield: Joi.number().required().messages({
    "any.required": "Milk yield is required.",
    "number.base": "Milk yield must be a number.",
    "number.empty": "Milk yield cannot be empty.",
  }),
  deliveryDate: Joi.date().required().allow(null).messages({
    "any.required": "Delivery date is required.",
    "date.base": "Delivery date must be a valid date.",
    "date.empty": "Delivery date cannot be empty.",
    "date.null": "Delivery date cannot be null.",
  }),
  weight: Joi.number().required().messages({
    "any.required": "Weight is required.",
    "number.base": "Weight must be a number.",
  }),
  offspringNumber: Joi.number().required().messages({
    "any.required": "Offspring number is required.",
    "number.base": "Offspring number must be a number.",
  }),
  observation: Joi.string().required().messages({
    "any.required": "Observation is required.",
    "string.base": "Observation must be a string.",
    "string.empty": "Observation cannot be empty.",
  }),
  fat: Joi.number().required().messages({
    "any.required": "Fat content is required.",
    "number.base": "Fat content must be a number.",
  }),
  snf: Joi.number().required().messages({
    "any.required": "Solid Not Fat (SNF) content is required.",
    "number.base": "SNF content must be a number.",
  }),
  lactose: Joi.number().required().messages({
    "any.required": "Lactose content is required.",
    "number.base": "Lactose content must be a number.",
  }),
  salt: Joi.number().required().messages({
    "any.required": "Salt content is required.",
    "number.base": "Salt content must be a number.",
  }),
  protein: Joi.number().required().messages({
    "any.required": "Protein content is required.",
    "number.base": "Protein content must be a number.",
  }),
  water: Joi.number().required().messages({
    "any.required": "Water content is required.",
    "number.base": "Water content must be a number.",
  }),
});

// Pregnancy Schema
const pregnancyJoiSchema = Joi.object({
  breed: Joi.string().required().messages({
    "any.required": "Breed is required.",
    "string.base": "Breed must be a string.",
    "string.empty": "Breed cannot be empty.",
  }),
  tagId: Joi.string().alphanum().required().messages({
    "any.required": "Tag ID is required.",
    "string.alphanum": "Tag ID must be alphanumeric.",
    "string.empty": "Tag ID cannot be empty.",
  }),
  status: Joi.string().valid("Yes", "No").required().messages({
    "any.required": "Status is required.",
    "any.only": "Status must be either Yes or No.",
  }),
  breedingDate: Joi.date().required().allow(null).messages({
    "any.required": "Breeding date is required.",
    "date.base": "Breeding date must be a valid date.",
    "date.empty": "Breeding date cannot be empty.",
    "date.null": "Breeding date cannot be null.",
  }),
  gestationPeriod: Joi.number().integer().min(0).required().messages({
    "any.required": "Gestation period is required.",
    "number.base": "Gestation period must be a number.",
    "number.min": "Gestation period must be at least 0.",
  }),
  ecd: Joi.date().allow(null).messages({
    "date.base": "Expected calving date (ECD) must be a valid date.",
    "date.null": "Expected calving date (ECD) cannot be null.",
  }),
  remark: Joi.string().optional().allow(""),
});

// Reset Password Schema
const joiResetPassword = Joi.object({
  newPassword: Joi.string().required().min(6).disallow(" ").trim().messages({
    "any.required": "New password is required.",
    "string.min": "New password must be at least 6 characters long.",
    "any.invalid": "New password cannot contain spaces.",
    "string.empty": "New password cannot be empty.",
  }),
});

module.exports = {
  joiResetPassword,
  joiLivestockSchema,
  joiFinanceSchema,
  joiEventSchema,
  lactatingLivestockJoiSchema,
  pregnancyJoiSchema,
};
