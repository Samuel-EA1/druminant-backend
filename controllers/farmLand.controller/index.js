const farmLandModel = require("../../models/farmland.model");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const farmlandModel = require("../../models/farmland.model");
const staffModel = require("../../models/staff.model");
const livestockModel = require("../../models/livestock.model");
const adminModel = require("../../models/admin.model");

const processFarmlandRequest = async (req, res) => {
  const { farmlandId, staffId } = req.params;
  const { status } = req.body;
  const { isAdmin } = req.user;

  try {
    if (!isAdmin) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json("Only the farmland admin is allowed to process this request");
    }

    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res.status(StatusCodes.NOT_FOUND).json("Farmland not found");
    }

    // Fetch staff
    const staff = await staffModel.findOne({ username: staffId });

    if (!staff) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Staff not found" });
    }

    const isStaffRequested = farmlandInDb.requests.includes(staff._id);
    const isStaffAccepted = farmlandInDb.staffs.includes(staff._id);
    const isStaffRejected = farmlandInDb.rejected.includes(staff._id);

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
        (reqId) => !mongoose.Types.ObjectId(reqId).equals(staff._id)
      );

      farmlandInDb.rejected = farmlandInDb.rejected.filter(
        (reqId) => !mongoose.Types.ObjectId(reqId).equals(staff._id)
      );
      // push staff id to the staffs array
      !farmlandInDb.staffs.includes(staff._id) &&
        farmlandInDb.staffs.push(staff._id);

      //  update staff farmalnd in profile
      staff.staffAt = farmlandId;
    } else if (status === "Reject" && (isStaffAccepted || isStaffRequested)) {
      farmlandInDb.staffs = farmlandInDb.staffs.filter(
        (reqId) => !mongoose.Types.ObjectId(reqId).equals(staff._id)
      );
      farmlandInDb.requests = farmlandInDb.requests.filter(
        (reqId) => !mongoose.Types.ObjectId(reqId).equals(staff._id)
      );
      !farmlandInDb.rejected.includes(staff._id) &&
        farmlandInDb.rejected.push(staff._id);

      staff.staffAt = "";
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
  const {
    breed,
    birthdate,
    sex,
    tagId,
    originStatus,
    tagLocation,
    weight,
    status,
    remark,
  } = req.body;
  const { farmlandId } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check if user is a admin or staff in the farmland

    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      // check for tagId uniquness
      const tagIdExist = await farmlandInDb.livestocks.some(
        (e) => e.tagId === tagId
      );

      if (tagIdExist) {
        return res.status(StatusCodes.CONFLICT).json({
          message: "The tagId provided is already taken",
        });
      }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      const livestockData = {
        inCharge: username,
        breed,
        birthdate: new Date(birthdate),
        sex,
        tagId,
        tagLocation,
        originStatus,
        weight,
        status,
        remark: remark || "",
      };

      farmlandInDb.livestocks.push(livestockData);

      await farmlandInDb.save();

      return res
        .status(StatusCodes.CREATED)
        .json({ message: "Livestock created successfully" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Only farmLand Admin or Staffs can create a livestock.",
      });
    }

    //
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// get a farmalnd
const farmLandDetails = async (req, res) => {
  const { farmlandId } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({
      farmland: farmlandId,
    });

    if (!farmlandInDb) {
      res.status(StatusCodes.NOT_FOUND).json({ Error: "FarmLand not found" });
    }

    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    // checking if admin or workers is allowed into the farmland
    if (!isStaffOrAdmin)
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ Error: "You do not have permision to access this farmland" });

    res.status(StatusCodes.OK).json(farmlandInDb);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// update livestock data

const updateLivestock = async (req, res) => {
  const { farmlandId, tagId } = req.params;
  const {
    breed,
    inCharge,
    birthdate,
    sex,
    tagLocation,
    weight,
    status,
    originStatus,
    remark,
  } = req.body;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ Error: "FarmLand not found" });
    }

    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);
    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    // Fetch livestock
    const fetchedLivestock = farmlandInDb.livestocks.find(
      (entry) => entry.tagId === tagId
    );

    if (!fetchedLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Livestock not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedLivestock.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      const updateFields = {};

      // Validate and set update fields
      if (sex && !["Male", "Female"].includes(sex)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "The sex provided is not a valid option" });
      }
      if (status && !["Healthy", "Sick", "Deceased"].includes(status)) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "The status provided is not a valid option" });
      }
      if (
        originStatus &&
        !["Purchased", "Born on Farm"].includes(originStatus)
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "The originStatus provided is not a valid option" });
      }

      if (breed !== undefined) updateFields["livestocks.$.breed"] = breed;
      if (birthdate !== undefined)
        updateFields["livestocks.$.birthdate"] = birthdate;
      if (sex !== undefined) updateFields["livestocks.$.sex"] = sex;
      if (tagLocation !== undefined)
        updateFields["livestocks.$.tagLocation"] = tagLocation;
      if (weight !== undefined) updateFields["livestocks.$.weight"] = weight;
      if (status !== undefined) updateFields["livestocks.$.status"] = status;
      if (originStatus !== undefined)
        updateFields["livestocks.$.originStatus"] = originStatus;
      if (remark !== undefined) updateFields["livestocks.$.remark"] = remark;

      const updatedFarmland = await farmLandModel.findOneAndUpdate(
        { farmland: farmlandId, "livestocks.tagId": tagId },
        { $set: updateFields },
        { new: true, arrayFilters: [{ "elem.tagId": tagId }] }
      );

      if (!updatedFarmland) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      const updatedLivestock = updatedFarmland.livestocks.find((e) =>
        mongoose.Types.ObjectId(e._id).equals(
          mongoose.Types.ObjectId(fetchedLivestock._id)
        )
      );

      return res.status(StatusCodes.OK).json(updatedLivestock);
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this livestock",
      });
    }
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// delete livestock

const deleteLivestock = async (req, res) => {
  const { farmlandId, tagId } = req.params;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ Error: "FarmLand not found" });
    }

    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    // Check if admin or workers are allowed into the farmland
    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    // Fetch livestock
    const fetchedLivestock = farmlandInDb.livestocks.find(
      (entry) => entry.tagId === tagId
    );

    if (!fetchedLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Livestock not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedLivestock.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      const deleted = await farmlandModel.findOneAndUpdate(
        {
          "livestocks.tagId": tagId,
        },
        { $pull: { livestocks: { tagId: tagId } } },
        { new: true }
      );

      return res
        .status(StatusCodes.OK)
        .json({ message: "Livestock successfully deleted" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this livestock",
      });
    }
  } catch (error) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error });
  }
};

// get livestock
const getLivestock = async (req, res) => {
  const { farmlandId, tagId } = req.params;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ Error: "FarmLand not found" });
    }

    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    // Check if admin or workers are allowed into the farmland
    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    // Fetch livestock
    const fetchedLivestock = farmlandInDb.livestocks.find(
      (entry) => entry.tagId === tagId
    );

    if (!fetchedLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Livestock not found",
      });
    }

    return res.status(StatusCodes.OK).json({ message: fetchedLivestock });
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

module.exports = {
  createLiveStock,
  farmLandDetails,
  processFarmlandRequest,
  updateLivestock,
  deleteLivestock,
  getLivestock,
};
