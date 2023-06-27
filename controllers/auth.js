const userModel = require("../models/User");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../errors");

const register = async (req, res) => {
  const user = await userModel.create({ ...req.body });
  const token = user.createJwt();
  res.status(StatusCodes.CREATED).json({
    user: user.name,
    token,
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("plese provide email and password!");
  }

  const user = await userModel.findOne({ email });

  if (!user) {
    throw new UnauthenticatedError("invalid credentials");
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    throw new UnauthenticatedError("Invalid credentials");
  }

  const name = user.name;
  const token = user.createJwt();
  res.status(StatusCodes.OK).json({ name, token });
};

module.exports = {
  register,
  login,
};
