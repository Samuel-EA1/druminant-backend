const farmLandModel = require("../../models/farmland.model");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const staffModel = require("../../models/staff.model");
const Joi = require("joi");
const adminModel = require("../../models/admin.model");

// Define Joi schema for registration
const registerSchema = Joi.object({
  username: Joi.string().min(3).max(15).required().trim(),
  email: Joi.string().email().required().trim().lowercase(),
  password: Joi.string().min(6).required().trim(),
  farmland: Joi.string().required().trim(),
});

module.exports = async (req, res) => {
  const { farmland, username, email, password } = req.body;
  const farmlandName = farmland.toLowerCase();
  const usernameString = username.toLowerCase();

  //  validate request body using
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      message: error.details[0].message,
    });
  }

  const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandName });
  const usernameInDb = await staffModel.findOne({ username: usernameString });

  try {
    const usernameInAdminCollection = await adminModel.findOne({
      username: usernameString,
    });
    const emailInAdminCollection = await adminModel.findOne({ email });
    const emailInStaffCollection = await staffModel.findOne({ email });

    if (usernameInAdminCollection || usernameInDb) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "Username is already taken" });
    } else if (username.includes(" ")) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Spaces are not allowed in username!" });
    } else if (emailInAdminCollection || emailInStaffCollection) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "Email is already taken" });
    } else if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Farmland not found" });
    }

    // create staff
    const user = await staffModel.create({
      username: usernameString,
      email,
      password,
      farmland: farmlandName,
    });

    // push user_id to farmland array
    await farmlandInDb.requests.push(user._id);
    await farmlandInDb.save();

    // save farmland to staff profile
    const staffData = await staffModel.findOne({ _id: user._id });

    // staffData.staffAt = farmlandInDb.farmland;
    // await staffData.save();

    // create token

    const token = staffData.createJwt();

    res.status(StatusCodes.CREATED).json({
      isAdmin: staffData.isAdmin,
      username: staffData.username,
      token,
    });
  } catch (error) {
    console.log(error);
    // delete staff from farmland
    return res.status(StatusCodes.BAD_GATEWAY).json(error);
    const farmStaffs = farmlandInDb.staffs;
    console.log(farmStaffs, "farmstaffs");
    const staff = await staffModel.findOne({ username });
    const updatedStaffs = farmStaffs.filter(
      (id) => id.toString() !== staff._id.toString()
    );
    farmlandInDb.staffs = updatedStaffs;
    await farmlandInDb.save();

    // delete staff from db
    await staffModel.findOneAndDelete({ username });
  }
};
