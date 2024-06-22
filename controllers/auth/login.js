const express = require("express");
const { BadRequestError, UnauthenticatedError } = require("../../errors");

const { StatusCodes } = require("http-status-codes");
const Joi = require("joi");
const staffModel = require("../../models/staff.model");
const adminModel = require("../../models/admin.model");

const validateSchema = Joi.object({
  username: Joi.string().min(3).max(15).required().trim(),
  password: Joi.string().min(6).required().trim(),
});
const login = async (req, res) => {
  const { username, password } = req.body;

  const { error, value } = validateSchema.validate(req.body);

  if (error)
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.details[0].message,
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
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ message: "Invalid credentials" });
      }
    }

    // If user is found, validate the password

    const isValidPassword = await user.comparePassword(password);

    if (!isValidPassword) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    // If password is valid, generate JWT token and respond

    const { isAdmin } = user;
    const token = user.createJwt();

    res.status(StatusCodes.OK).json({
      isAdmin,
      username: user.username,
      status: user.status,
      farmland: user.farmland,
      token,
    });
  } catch (error) {
    throw new UnauthenticatedError("Invalid credentials");
  }
};

module.exports = { login };
