const jwt = require("jsonwebtoken");
const { BadRequestError, UnauthenticatedError } = require("../errors");
const { StatusCodes } = require("http-status-codes");

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

    req.user = { name: payLoad.name, id: payLoad.id };
  } catch (error) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Invalid token" });
  }

  next();
};

module.exports = authMiddleware;
