const express = require("express");
const { BadRequestError, UnauthenticatedError } = require("../errors");
 
const { StatusCodes } = require("http-status-codes");
const adminModel = require("../models/admin.model");
const staffModel = require("../models/staff.model");

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide email and password!");
  }
  let user;

  // Check if the user is a farm worker
  user = await staffModel.findOne({ email });
  if (!user) {
    // If not, check if the user is an admin
    user = await adminModel.findOne({ email });
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
};

module.exports = login;
