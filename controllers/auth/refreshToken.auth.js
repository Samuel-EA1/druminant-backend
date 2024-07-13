const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const staffModel = require("../../models/staff.model");
const adminModel = require("../../models/admin.model");

const refreshToken = async (req, res) => {
  try {
    const oldToken = req.headers.authorization.split(" ")[1];
    // Verify and decode the old token
    const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);

    // Fetch the latest status of the staff from the database
    const user =
      (await staffModel.findById({ _id: decoded.id })) ||
      (await adminModel.findById({ _id: decoded.id }));

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Staff not found" });
    }

    // Issue a new token with the updated status
    const newToken = jwt.sign(
      {
        id: user.id,
        isAdmin: user.isAdmin,
        username: user.username,
        farmland: user.farmland,
        status: user.status,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_LIFETIME,
      }
    );

    console.log(newToken);

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
