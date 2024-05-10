const adminModel = require("../../models/admin.model");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const staffModel = require("../../models/staff.model");
const farmlandModel = require("../../models/farmland.model");
const mongoose = require("mongoose");

const register = async (req, res) => {
  const { username, farmland, email, password } = req.body;

  // check if none of the req body is empty.
  if (
    !username.toString().trim() ||
    !farmland ||
    !email.toString().trim() ||
    !password.toString().trim()
  ) {
    res.status(StatusCodes.BAD_REQUEST).json({
      Error: "Please provide a username, email, password, and farmland",
    });
  }

  // check if any of the req body is available or not
  const usernameInAdminCollection = await adminModel.findOne({ username });
  const usernameInStaffCollection = await staffModel.findOne({ username });
  const emailInAdminCollection = await adminModel.findOne({ email });
  const emailInStaffCollection = await staffModel.findOne({ email });
  const farmlandInFarmCollection = await farmlandModel.findOne({
    farmland,
  });

  if (usernameInAdminCollection || usernameInStaffCollection) {
    throw new Error("Username is already taken");
  } else if (emailInAdminCollection || emailInStaffCollection) {
    throw new Error("Email is already taken");
  } else if (farmlandInFarmCollection) {
    throw new Error("Farmland name is already taken");
  }

  try {
    //  create farmland
    const createFarmland = await farmlandModel.create({ farmland });

    if (createFarmland) {
      // create admin
      const user = await adminModel.create({ username, email, password });

      if (user) {
        // asign created farmland to the admin
        const adminFarmland = await farmlandModel.findOne({
          _id: createFarmland._id,
        });

        // save farmland admin
        adminFarmland.admin = mongoose.Types.ObjectId(user._id);
        await adminFarmland.save();

        // save farmlandName to admin profile
        const adminData = await adminModel.findOne({ username });

        adminData.adminAt = adminFarmland.farmland;
        await adminData.save();

        // create jwt
        const token = adminData.createJwt();

        // response
        res.status(StatusCodes.CREATED).json({
          isAdmin: adminData.isAdmin,
          username: adminData.username,
          adminAt: adminData.adminAt,
          token,
        });
      } else {
        throw new Error("Failed creating Admin account");
      }
    } else {
      throw new Error("Failed creating farmland");
    }
  } catch (error) {
    await farmlandModel.findOneAndDelete({ farmland });
    await adminModel.findOneAndDelete({ username });
    throw new Error(error);
  }
};

module.exports = {
  register,
};
