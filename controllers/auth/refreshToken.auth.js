const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const staffModel = require("../../models/staff.model");

const refreshToken = async (req, res) => {
  try {
    const oldToken = req.headers.authorization.split(" ")[1];

    // Verify and decode the old token
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);
 console.log(decoded)
    // Fetch the latest status of the staff from the database
    const staff = await staffModel.findById({ _id: decoded.id });
    if (!staff) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Staff not found" });
    }

    const newStatus = staff.status;

    // Issue a new token with the updated status
    const newToken = jwt.sign(
      {
        staffId: decoded.id,
        isAdmin: decoded.isAdmin,
        username: decoded.username,
        farmland: decoded.farmland,
        status: newStatus,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_LIFETIME,
      }
    );

    res.status(StatusCodes.OK).json({ message: newToken });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Token expired" });
    } else if (error.name === "JsonWebTokenError") {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid token" });
    } else {
      console.error("Error refreshing token:", error);
      return res
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .json({ message: "Internal server error" });
    }
  }
};

module.exports = refreshToken;
