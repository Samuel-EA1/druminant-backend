const jwt = require("jsonwebtoken");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const { StatusCodes } = require("http-status-codes");
var mongoose = require("mongoose");

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("unauthorized access");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new BadRequestError("no token provided");
  }

  try {
    const payLoad = jwt.verify(token, process.env.JWT_SECRET);
    const userId = mongoose.Types.ObjectId(payLoad.id);

    req.user = {
      isAdmin: payLoad.isAdmin,
      id: userId,
      username: payLoad.username
    };
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid token" });
  }

  next();
};

module.exports = authMiddleware;
