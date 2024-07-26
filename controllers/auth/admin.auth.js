const adminModel = require("../../models/admin.model");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const staffModel = require("../../models/staff.model");
const farmlandModel = require("../../models/farmland.model");
const mongoose = require("mongoose");
const Joi = require("joi");

// Define Joi schema for registration
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(15).required().trim(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).required().trim(),
  farmland: Joi.string().required().trim(),
});

module.exports = async (req, res) => {
  const { username, farmland, email, password } = req.body;
  const farmlandName = farmland.toLowerCase();
  const usernameString = username.toLowerCase();

  // check if none of the req body is empty.
  //  validate request body using
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.details[0].message,
    });
  }

  // check if any of the req body is available or not
  const usernameInAdminCollection = await adminModel.findOne({
    username: usernameString,
  });
  const usernameInStaffCollection = await staffModel.findOne({
    username: usernameString,
  });
  const emailInAdminCollection = await adminModel.findOne({ email });
  const emailInStaffCollection = await staffModel.findOne({ email });
  const farmlandInFarmCollection = await farmlandModel.findOne({
    farmland: farmlandName,
  });

  if (usernameInAdminCollection || usernameInStaffCollection) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "Username is already taken" });
  } else if (username.includes(" ")) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Spaces are not allowed in username" });
  } else if (emailInAdminCollection || emailInStaffCollection) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "Email is already taken" });
  } else if (farmlandInFarmCollection) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland name is already taken" });
  } else if (farmland.includes(" ")) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Spaces are not allowed in farmland name" });
  }

  try {
    //  create farmland
    const createFarmland = await farmlandModel.create({
      farmland: farmlandName,
    });

    if (createFarmland) {
      // create admin
      const user = await adminModel.create({
        username: usernameString,
        email,
        password,
        farmland: farmlandName,
      });

      if (user) {
        // asign created farmland to the admin
        const adminFarmland = await farmlandModel.findOne({
          _id: createFarmland._id,
        });

        // save farmland admin
        adminFarmland.admin = user._id;
        await adminFarmland.save();

        // save farmlandName to admin profile
        const adminData = await adminModel.findOne({
          username: usernameString,
        });

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
    console.log(error);
    await farmlandModel.findOneAndDelete({ farmland: farmlandName });
    await adminModel.findOneAndDelete({ username: usernameString });
    throw new Error(error);
  }
};
