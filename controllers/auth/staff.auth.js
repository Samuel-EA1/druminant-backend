const farmLandModel = require("../../models/farmland.model");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const staffModel = require("../../models/staff.model");

const register = async (req, res) => {
  const { farmland, username, email, password } = req.body;

  const farmlandInDb = await farmLandModel.findOne({ farmland });

  const usernameInDb = await staffModel.findOne({ username });

  if (farmland === "") {
    throw new Error("Please provide a farmland");
  } else if (!farmlandInDb) {
    return res.status(StatusCodes.BAD_REQUEST).json({ Message: "Farmland not found" });
  } else if (username.toString().trim() === "") {
    throw new Error("please provide a username");
  } else if (usernameInDb) {
    throw new Error("Username is not available");
  }

  try {
    // create staff
    const user = await staffModel.create({ username, email, password });

    // push user_id to farmland array
    await farmlandInDb.staffs.push(user._id);
    await farmlandInDb.save();

    // save farmland to staff profile
    const staffData = await staffModel.findOne({ _id: user._id });

    staffData.staffAt = farmlandInDb.farmland;
    await staffData.save();

    console.log(farmlandInDb.farmland);
    // create token

    const token = staffData.createJwt();

    res.status(StatusCodes.CREATED).json({
      isAdmin: staffData.isAdmin,
      username: staffData.username,
      staffAt: staffData.staffAt,
      token,
    });
  } catch (error) {
    // delete staff from farmland
    const farmStaffs = farmlandInDb.staffs;
    console.log(farmStaffs, "farmstaffs");
    const staff = await staffModel.findOne({ username });
    console.log(staff._id, "staffid\n");
    const updatedStaffs = farmStaffs.filter(
      (id) => id.toString() !== staff._id.toString()
    );

    console.log(updatedStaffs, "updatefedstaffs\n");
    farmlandInDb.staffs = updatedStaffs;
    await farmlandInDb.save();

    console.log(farmlandInDb.staffs, "real staffs");
    // delete staff from db
    await staffModel.findOneAndDelete({ username });
    throw new Error(error);
  }
};

module.exports = {
  register,
};
