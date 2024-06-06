const express = require("express");
const { BadRequestError, UnauthenticatedError } = require("../errors");

const { StatusCodes } = require("http-status-codes");
const adminModel = require("../models/admin.model");
const staffModel = require("../models/staff.model");
const Joi = require("joi");

const validateSchema = Joi.object({
  username: Joi.string().min(3).max(15).required().trim(),
  password: Joi.string().min(6).required().trim(),
});
const login = async (req, res) => {
  const { username, password } = req.body;

  const { error, value } = validateSchema.validate(req.body);

  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({
      Error: error.details[0].message,
    });

  try {
    let user;

    // Check if the user is a farm worker
    user = await staffModel.findOne({ username });
    if (!user) {
      // If not, check if the user is an admin
      user = await adminModel.findOne({ username });
      if (!user) {
        // If neither, throw an error
        throw new UnauthenticatedError("Invalid credentials");
      }
    }

    // If user is found, validate the password

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      throw new UnauthenticatedError("Invalid credentials");
    }

    // If password is valid, generate JWT token and respond
    const name = user.username;
    const { isAdmin } = user;
    const token = user.createJwt();

    res.status(StatusCodes.OK).json({ isAdmin, username: name, token });
  } catch (error) {
    throw new UnauthenticatedError("Invalid credentials");
  }
};

module.exports = login;
