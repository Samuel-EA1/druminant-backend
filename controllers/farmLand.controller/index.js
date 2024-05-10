const farmLandModel = require("../../models/farmland.model");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");

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
};
