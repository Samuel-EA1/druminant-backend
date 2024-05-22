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
    const isStaffRejected = farmlandInDb.rejected.includes(staffId);

    // Fetch staff
    const staff = await staffModel.findOne({ username: staffId });

    if (!staff) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Staff not found" });
    }

    // Update staff status and handle validation
    try {
      staff.status = status;
    } catch (validationError) {
      if (validationError.errors && validationError.errors["status"]) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: validationError.errors["status"].message });
      }
      throw validationError; // rethrow if it's an unexpected error
    }

    // Update farmland request and staff array
    if (!["Accept", "Reject"].includes(status)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json("Provided status not recorganized");
    }

    if (status === "Accept" && (isStaffRequested || isStaffRejected)) {
      farmlandInDb.requests = farmlandInDb.requests.filter(
        (reqId) => reqId !== staffId
      );

      farmlandInDb.rejected = farmlandInDb.rejected.filter(
        (reqId) => reqId !== staffId
      );
      farmlandInDb.staffs.push(staffId);
    } else if (status === "Reject" && (isStaffAccepted || isStaffRequested)) {
      farmlandInDb.staffs = farmlandInDb.staffs.filter(
        (reqId) => reqId !== staffId
      );
      farmlandInDb.requests = farmlandInDb.requests.filter(
        (reqId) => reqId !== staffId
      );

      farmlandInDb.rejected.push(staffId);
    } else if (
      (status === "Reject" || status === "Accept") &&
      (isStaffAccepted || isStaffRejected)
    ) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json(`Staff is already ${status}ed`);
    }
    await staff.save();
    await farmlandInDb.save();

    return res.status(StatusCodes.CREATED).json({
      message: ` Staff successfully ${status}ed`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred" });
  }
};

// livestock
const createLiveStock = async (req, res) => {
  const { tagId, eventType, eventDate } = req.body;
  const { farmlandId } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not available" });
    }

    

     return res
       .status(StatusCodes.BAD_REQUEST)
       .json({ message: "Livestock created successfully" });
    //
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
  createLiveStock,
  farmLandDetails,
  processFarmlandRequest,
};
