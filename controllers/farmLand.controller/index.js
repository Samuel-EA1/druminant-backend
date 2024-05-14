const farmLandModel = require("../../models/farmland.model");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const farmlandModel = require("../../models/farmland.model");
const staffModel = require("../../models/staff.model");

const processFarmlandRequest = async (req, res) => {
  const { farmlandId, staffId } = req.params;
  const { status } = req.body;
  const { isAdmin } = req.user;

  try {
    if (!isAdmin) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json("Only Admins are allowed to process this request");
    }

    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res.status(StatusCodes.NOT_FOUND).json("Farmland not found");
    }

    const isStaffRequested = farmlandInDb.requests.includes(staffId);
    const isStaffAccepted = farmlandInDb.staffs.includes(staffId);

    // Fetch staff
    const staff = await staffModel.findOne({ username: staffId });

    // Update staff status
    staff.status = status;
    await staff.save();

    // Update farmland request and staff array
    farmlandInDb.requests = farmlandInDb.requests.filter(
      (reqId) => reqId !== staffId
    );

    if (status === "Accepted" && isStaffRequested) {
      farmlandInDb.staffs.push(staffId);
    } else if (status === "Rejected" && isStaffAccepted) {
      farmlandInDb.staffs = farmlandInDb.staffs.filter(
        (staff) => staff !== staffId
      );
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json("Provided status not reorganized");
    }

    await farmlandInDb.save();

    return res
      .status(StatusCodes.CREATED)
      .json({ staffs: farmlandInDb.staffs, requests: farmlandInDb.requests });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred" });
  }
};

const createFarmland = async (req, res) => {
  const adminId = req.user.id;
  const { name } = req.body;

  if (!req.user.isAdmin) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ Error: "Only admins can create a farmland" });
  }

  try {
    const farmlandInDb = await farmLandModel.findOne({ name });

    if (farmlandInDb)
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ Error: "Farmland name not available" });

    const farmlandData = { ...req.body, admin: adminId };

    const farmLand = await farmLandModel.create(farmlandData);
    res.status(StatusCodes.CREATED).json({ farmLand });
  } catch (error) {
    console.error("Error creating farmland:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "Failed to create farmland" });
  }
};

const farmLandDetails = async (req, res) => {
  const { name } = req.params;

  const farmlandInDb = await farmLandModel.findOne({ farmlandName: name });

  if (!farmlandInDb)
    res.status(StatusCodes.NOT_FOUND).json({ Error: "FarmLand not found" });

  const farmAdminId = await farmlandInDb.admin.toString();

  const userId = req.user.id.toString();
  const isAdmin = req.user.isAdmin;

  const farmlandWithUser = await farmLandModel.findOne({
    name: name,
    farmWorkers: { $in: [mongoose.Types.ObjectId(userId)] },
  });

  console.log(farmlandWithUser);
  // checking if admin or workers is allowed into the farmland
  if ((isAdmin && farmAdminId !== userId) || (!isAdmin && !farmlandWithUser))
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ Error: "You don not have permision to access this farmland" });

  res.status(StatusCodes.OK).json({ farmlandInDb });

  try {
  } catch (error) {}
};

const deleteFarmland = async (req, res) => {
  try {
  } catch (error) {}
};

module.exports = {
  createFarmland,
  farmLandDetails,
  processFarmlandRequest,
};
