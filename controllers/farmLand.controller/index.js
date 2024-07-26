const farmLandModel = require("../../models/farmland.model");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const farmlandModel = require("../../models/farmland.model");
const staffModel = require("../../models/staff.model");
const adminModel = require("../../models/admin.model");
const Joi = require("joi");

const {
  getQuarantinedModel,
  getLivestockModel,
  getFinanceModel,
  getEventModel,
  getLactationModel,
  getPregnancyModel,
} = require("../../models/getDynameModels");
const {
  joiLivestockSchema,
  joiFinanceSchema,
  joiEventSchema,
  lactatingLivestockJoiSchema,
  pregnancyJoiSchema,
} = require("./farmValidation/joivalidations");

// Joi schema for quarantine schema
const quarantineJoiSchema = Joi.object({
  quarantineDate: Joi.date().required(),
  reason: Joi.string().required(),
});

//  farmland requests
const processFarmlandRequest = async (req, res) => {
  const { farmlandId, staffId } = req.params;
  const { status } = req.body;
  const { isAdmin } = req.user;

  try {
    if (!isAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Only the farmland admin is allowed to process this request",
      });
    }

    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Farmland not found" });
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
        .json({ message: "Provided status is not recorganized" });
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

const sentRequest = async (req, res) => {
  const { farmland } = req.body;

  try {
    const farmlandInDb = await farmlandModel.findOne({ farmland });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Farmland not found" });
    }

    const token = req.headers.authorization.split(" ")[1];

    // Verify and decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Fetch staff
    const staff = await staffModel.findOne({ _id: decoded.id });

    if (!staff) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Staff not found" });
    }

    if (staff.status !== "Reject") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Your request must have been reject to proceed!" });
    }

    const sent = farmlandInDb.requests.push(staff.id);
    staff.status = "Pending";
    await staff.save();
    await farmlandInDb.save();

    return res.status(StatusCodes.CREATED).json({
      message: ` Request successfully sent`,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred" });
  }
};

// get staffs
const getFarmlandStaffs = async (req, res) => {
  const { farmlandId } = req.params;
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

    // get staffs

    const accepted = await farmlandInDb.staffs;

    const staffRes = await Promise.all(
      accepted.map(async (_id) => await staffModel.findOne({ _id }))
    );

    const staff = staffRes.map((staff) => ({
      username: staff.username,
      email: staff.email,
    }));

    return res.status(StatusCodes.OK).json({
      message: staff,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred" });
  }
};

const getFarmlandrequests = async (req, res) => {
  const { farmlandId } = req.params;
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

    // get staffs

    const accepted = await farmlandInDb.requests;

    if (accepted.length < 1) {
      return res.status(StatusCodes.OK).json({ message: [] });
    }

    const pendingRes = await Promise.all(
      accepted.map(async (_id) => await staffModel.findOne({ _id }))
    );

    const staff = pendingRes.map((req) => ({
      username: req.username,
      email: req.email,
    }));

    return res.status(StatusCodes.OK).json({
      message: staff,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "An error occurred" });
  }
};

// livestock
const createLivestock = async (req, res) => {
  const {
    breed,
    birthDate,
    sex,
    tagId,
    origin,
    tagLocation,
    weight,
    status,
    remark,
  } = req.body;
  const { farmlandId, livestockType } = req.params;

  try {
    const { error } = joiLivestockSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }

    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

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
      // Get the livestock model for this farmland
      const livestockModel = getLivestockModel(farmlandId, livestockType);
      const quarantineModel = getQuarantinedModel(farmlandId, livestockType);

      if (tagId && tagId.includes(" ")) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "TagId Entry ID should not contain spaces." });
      }

      const existingQuarantineStock = await quarantineModel.findOne({ tagId });

      if (existingQuarantineStock) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message:
            "There is already an existing livestock with this ID quarantined.",
        });
      }

      // Check for duplicate tagId within the same farmland collection
      const existingLivestock = await livestockModel.findOne({
        tagId: tagId.toLowerCase(),
      });
      if (existingLivestock) {
        return res
          .status(400)
          .json({ message: "Tag ID already exists for this farmland" });
      }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new Livestock
      const newLivestock = {
        inCharge: username,
        breed,
        birthDate: new Date(birthDate),
        sex,
        tagId,
        tagLocation,
        origin,
        weight,
        status,
        remark: remark,
      };

      await livestockModel.create(newLivestock);

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
      res.status(StatusCodes.NOT_FOUND).json({ message: "FarmLand not found" });
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
        .json({ message: "You do not have permision to access this farmland" });

    res.status(StatusCodes.OK).json(farmlandInDb);
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// update livestock data

const updateLivestock = async (req, res) => {
  console.log("hi");
  const { farmlandId, livestockId, livestockType } = req.params;
  const {
    breed,
    birthDate,
    sex,
    tagId,
    tagLocation,
    weight,
    status,
    origin,
    remark,
  } = req.body;
  tagId;

  livestockId;
  console.log(livestockId);
  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
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

    const livestock = getLivestockModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedLivestock = await livestock.findOne({ _id: livestockId });

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

      if (
        status &&
        !["Healthy", "Sick", "Deceased", "Pregnant", "Injured"].includes(status)
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "The status provided is not a valid option" });
      }
      if (
        origin &&
        ![
          "Born on farm",
          "Purchased",
          "Donated",
          "Inherited",
          "Adopted",
        ].includes(origin)
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "The origin provided is not a valid option" });
      }

      if (tagId && tagId.includes(" ")) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "TagId Entry ID should not contain spaces." });
      }

      if (
        !breed ||
        birthDate === "Invalid date" ||
        !sex ||
        !tagId ||
        !tagLocation ||
        !weight ||
        !status ||
        !origin
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Please, ensure you fill all fields!",
        });
      }

      if (breed !== undefined) updateFields["breed"] = breed;
      if (birthDate !== undefined) updateFields["birthDate"] = birthDate;
      if (sex !== undefined) updateFields["sex"] = sex;
      if (tagId !== undefined) updateFields["tagId"] = tagId.toLowerCase();
      if (tagLocation !== undefined) updateFields["tagLocation"] = tagLocation;
      if (weight !== undefined) updateFields["weight"] = weight;
      if (status !== undefined) updateFields["status"] = status;
      if (origin !== undefined) updateFields["origin"] = origin;
      if (remark !== undefined) updateFields["remark"] = remark;

      const updated = await livestock.findOneAndUpdate(
        { _id: livestockId },
        { $set: updateFields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      return res.status(StatusCodes.OK).json({ message: updated });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this livestock",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

// delete livestock

const deleteLivestock = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;

  try {
    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
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

    // get livestock model
    const livestock = getLivestockModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedLivestock = await livestock.findOne({ tagId: livestockId });

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
      const deleteentry = await livestock.findOneAndDelete({
        tagId: livestockId,
      });

      if (!deleteentry) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "delete failed" });
      }

      return res
        .status(StatusCodes.OK)
        .json({ message: "Livestock successfully deleted" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this livestock",
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error });
  }
};

// get livestock

const getLivestock = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const livestockModel = getLivestockModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedLivestock = await livestockModel.findOne({
      tagId: livestockId,
    });

    if (!fetchedLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Livestock not found",
      });
    }

    return res.status(StatusCodes.OK).json({ message: fetchedLivestock });
  } catch (error) {
    console.error("Error fetching livestock:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const getAllLivestocks = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const livestockModel = getLivestockModel(farmlandId, livestockType);
    const allLivestocks = await livestockModel.find();

    return res.status(StatusCodes.OK).json({ message: allLivestocks });
  } catch (error) {
    console.error("Error fetching livestock:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const quarantine = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;
  const { action, quarantineDate, reason } = req.body;

  if (!["Quarantine", "Release"].includes(action)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Provided action is not recorganized" });
  }

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
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

    // fetch livstock model
    const quarantineModel = getQuarantinedModel(farmlandId, livestockType);
    const livestockModel = getLivestockModel(farmlandId, livestockType);

    // Fetch livestock
    const isReleased = await livestockModel.findOne({ tagId: livestockId });
    const isQuarantined = await quarantineModel.findOne({ tagId: livestockId });

    //  check if the livestock is on the farmland
    if (!isReleased && !isQuarantined) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Livestock not found on this farmland",
      });
    }

    if (
      (isReleased ? isReleased.inCharge : isQuarantined.inCharge) ===
        requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      if (action === "Quarantine" && isReleased) {
        // check for quarantine date  and reason

        const { error } = quarantineJoiSchema.validate({
          quarantineDate,
          reason,
        });

        if (error) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            message: error.details[0].message,
          });
        }

        // push livestock to quarantine model

        const newQuarantine = {
          inCharge: isReleased.inCharge,
          quarantineDate: new Date(quarantineDate),
          reason: reason,
          breed: isReleased.breed,
          birthDate: isReleased.birthDate,
          sex: isReleased.sex,
          tagId: isReleased.tagId,
          tagLocation: isReleased.tagLocation,
          origin: isReleased.origin,
          weight: isReleased.weight,
          status: isReleased.status,
          remark: isReleased.remark,
        };

        await quarantineModel.create(newQuarantine);

        // delete from livestockmodel
        await livestockModel.findOneAndDelete({ tagId: livestockId });
      } else if (action === "Release" && isQuarantined) {
        // create a  document in the livestock model with the newly released data
        const newLivestock = {
          inCharge: isQuarantined.inCharge,
          breed: isQuarantined.breed,
          birthDate: isQuarantined.birthDate,
          sex: isQuarantined.sex,
          tagId: isQuarantined.tagId,
          tagLocation: isQuarantined.tagLocation,
          origin: isQuarantined.origin,
          weight: isQuarantined.weight,
          status: isQuarantined.status,
          remark: isQuarantined.remark,
        };
        await livestockModel.create(newLivestock);

        // delete from quaratine model

        await quarantineModel.findOneAndDelete({ tagId: livestockId });
      } else if (
        (action === "Quarantine" || action === "Release") &&
        (isQuarantined || isReleased)
      ) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: `Livestock already ${action}d` });
      }

      res
        .status(StatusCodes.CREATED)
        .json({ message: `Livestock successfully ${action}d` });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this livestock",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

const getAllQuarantine = async (req, res) => {
  const { farmlandId, livestockType } = req.params;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
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

    // fetch livstock model
    const quarantineModel = getQuarantinedModel(farmlandId, livestockType);

    // check for quarantine date  and reason

    const getAllQuarantined = await quarantineModel.find();

    res.status(StatusCodes.CREATED).json({ message: getAllQuarantined });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

const getAQuarantine = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
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

    // fetch livstock model
    const quarantineModel = getQuarantinedModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedLivestock = await quarantineModel.findOne({
      tagId: livestockId,
    });

    if (!fetchedLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Livestock not found",
      });
    }

    res.status(StatusCodes.CREATED).json({ message: fetchedLivestock });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

// Finance routes
// create finance

const createFinance = async (req, res) => {
  const { desc, transactionDate, amount, paymentmethod, financeEntryId } =
    req.body;
  const { farmlandId, livestockType, financeType } = req.params;

  try {
    const { error } = joiFinanceSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check if the livestock type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid finance type" });
    }

    // check if user is a admin or staff in the farmland
    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      // Get the Finance modelfor this farmland
      const financeModel = getFinanceModel(
        farmlandId,
        livestockType,
        financeType
      );

      // if (financeEntryId.includes(" ")) {
      //   return res
      //     .status(StatusCodes.BAD_REQUEST)
      //     .json({ message: "Finance Entry ID should not contain spaces." });
      // }

      // Check for duplicate financeId within the same farmland collection
      // const existingFinance = await financeModel.findOne({
      //   financeEntryId,
      // });
      // if (existingFinance) {
      //   return res.status(400).json({
      //     message:
      //       "Finance Id already exists for this farmland and finance type",
      //   });
      // }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new cattle
      const newFinance = {
        inCharge: username,
        paymentmethod,
        desc,
        transactionDate: new Date(transactionDate),
        amount,
      };

      // create finance document

      await financeModel.create(newFinance);

      return res
        .status(StatusCodes.CREATED)
        .json({ message: "Finance created successfully" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message:
          "Only farmLand Admin or Staffs can create, view and modify Finance record!",
      });
    }

    //
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// update finance
const updateFinance = async (req, res) => {
  const { desc, transactionDate, amount, paymentmethod } = req.body;
  const { farmlandId, livestockType, financeType, financeId } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check if the livestock type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid finance type" });
    }

    // check if user is a admin or staff in the farmland
    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      const updateFields = {};

      // Get the Finance modelfor this farmland
      const FinanceModel = getFinanceModel(
        farmlandId,
        livestockType,
        financeType
      );

      // Check for duplicate financeId within the same farmland collection
      const existingFinance = await FinanceModel.findOne({
        _id: financeId,
      });

      if (!existingFinance) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `${financeType} not found`,
        });
      }

      if (
        existingFinance.inCharge !== requester.username &&
        !mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
      ) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message:
            "Sorry, only farmland admins or record creators can update this record.",
        });
      }

      // if (financeEntryId && financeEntryId.includes(" ")) {
      //   return res
      //     .status(StatusCodes.BAD_REQUEST)
      //     .json({ message: "Finance Entry ID should not contain spaces." });
      // }

      if (
        !desc ||
        transactionDate === "Invalid date" ||
        !amount ||
        !paymentmethod
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Please, ensure you fill all fields!",
        });
      }
      if (desc !== undefined) updateFields["desc"] = desc;
      if (transactionDate !== undefined)
        updateFields["transactionDate"] = transactionDate;
      if (amount !== undefined) updateFields["amount"] = amount;
      if (paymentmethod !== undefined)
        updateFields["paymentmethod"] = paymentmethod;

      const updated = await FinanceModel.findOneAndUpdate(
        { _id: financeId },
        { $set: updateFields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      return res.status(StatusCodes.OK).json({ message: updated });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Only farmLand Admin or Staffs can create a livestock.",
      });
    }

    //
  } catch (error) {
    console.log(error.MongoError);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// delete finance
const deleteFinance = async (req, res) => {
  const { farmlandId, livestockType, financeType, financeId } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check if the livestock type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid finance type" });
    }

    // check if user is a admin or staff in the farmland
    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      // Get the Finance model for this farmland
      const FinanceModel = getFinanceModel(
        farmlandId,
        livestockType,
        financeType
      );

      // Check for duplicate financeId within the same farmland collection

      const existingFinance = await FinanceModel.findOne({
        _id: financeId,
      });

      if (!existingFinance) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `${financeType} not found`,
        });
      }

      if (
        existingFinance.inCharge !== requester.username &&
        !mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
      ) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          message:
            "Sorry, only farmland admins or record creators can delete this record.",
        });
      }
      // delete document

      const deleteentry = await FinanceModel.findOneAndDelete({
        _id: financeId,
      });

      if (!deleteentry) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "delete failed" });
      }

      return res
        .status(StatusCodes.OK)
        .json({ message: "Finance successfully deleted" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message:
          "Only farmLand Admin or Staffs can create, view and modify Finance record!",
      });
    }

    //
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// get a finance

const getFinance = async (req, res) => {
  const { farmlandId, livestockType, financeType, financeId } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check if the livestock type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid finance type" });
    }

    // check if user is a admin or staff in the farmland
    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      // Get the Finance model for this farmland
      const FinanceModel = getFinanceModel(
        farmlandId,
        livestockType,
        financeType
      );

      // Check for duplicate financeId within the same farmland collection

      const existingFinance = await FinanceModel.findOne({
        _id: financeId,
      });

      if (!existingFinance) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `${financeType} not found`,
        });
      }

      return res.status(StatusCodes.OK).json({ message: existingFinance });
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

// get all finances
const getAllFinances = async (req, res) => {
  const { farmlandId, livestockType, financeType } = req.params;

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check if the livestock type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid finance type" });
    }

    // check if user is a admin or staff in the farmland
    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      // Get the Finance model for this farmland
      const FinanceModel = getFinanceModel(
        farmlandId,
        livestockType,
        financeType
      );

      const expenseModel = getFinanceModel(
        farmlandId,
        livestockType,
        "expense"
      );
      const incomeModel = getFinanceModel(farmlandId, livestockType, "income");

      const expenseData = await expenseModel.find();
      const incomeData = await incomeModel.find();
      const incomeLength = incomeData.length;
      const expenseLength = expenseData.length;
      const incomeAmount = incomeData.reduce(
        (total, entry) => total + entry.amount,
        0
      );
      const incomeAmountTotal = incomeAmount.toFixed(2);
      const expenseAmount = expenseData.reduce(
        (total, entry) => total + entry.amount,
        0
      );
      const expenseAmountTotal = expenseAmount.toFixed(2);

      const allFinance = await FinanceModel.find();

      return res.status(StatusCodes.OK).json({
        message: {
          incomeAmountTotal,
          expenseAmountTotal,
          incomeLength,
          expenseLength,
          allFinance,
        },
      });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message:
          "Only farmLand Admin or Staffs can create, view and modify Finance record!",
      });
    }

    //
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// event routes

// livestock
const createEvent = async (req, res) => {
  const { tagId, eventType, eventDate, remark } = req.body;
  const { farmlandId, livestockType } = req.params;

  try {
    const { error } = joiEventSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }

 

    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

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
      // Get the event model for this farmland
      const eventCollection = getEventModel(farmlandId, livestockType);

      // if (eventEntryId && eventEntryId.includes(" ")) {
      //   return res
      //     .status(StatusCodes.BAD_REQUEST)
      //     .json({ message: "Event Entry ID should not contain spaces." });
      // }

      // Check for duplicate eventEntryId within the same farmland,livestock collection
      // const existingEvent = await eventCollection.findOne({
      //   eventEntryId,
      // });
      // if (existingEvent) {
      //   return res
      //     .status(400)
      //     .json({ message: "Event Id already exists for this livestock type" });
      // }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new event
      const newEvent = {
        inCharge: username,
        eventDate: new Date(eventDate),
        eventType,
        tagId:tagId.toLowerCase(),
        remark,
      };

      await eventCollection.create(newEvent);

      return res
        .status(StatusCodes.CREATED)
        .json({ message: "Livestock created successfully" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Only farmLand Admin or Staffs can create an event.",
      });
    }

    //
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// update livestock data

const updateEvent = async (req, res) => {
  const { tagId, eventType, eventDate, remark } = req.body;
  const { farmlandId, livestockType, eventId } = req.params;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
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

    const eventCollection = getEventModel(farmlandId, livestockType);

    // Fetch event
    const fetchedEvent = await eventCollection.findOne({
      _id: eventId,
    });

    if (!fetchedEvent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Event not found",
      });
    }

    // Check for event ownership
    if (
      fetchedEvent.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      // if (eventEntryId && eventEntryId.includes(" ")) {
      //   return res
      //     .status(StatusCodes.BAD_REQUEST)
      //     .json({ message: "Event Entry ID should not contain spaces." });
      // }

      if (!tagId || !eventType || eventDate === "Invalid date") {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Please, ensure you fill all fields!",
        });
      }

      const updateFields = {};
      if (tagId !== undefined) updateFields["tagId"] = tagId.toLowerCase();
      if (eventType !== undefined) updateFields["eventType"] = eventType;
      if (eventDate !== undefined) updateFields["eventDate"] = eventDate;
      if (remark !== undefined) updateFields["remark"] = remark;

      const updated = await eventCollection.findOneAndUpdate(
        { _id: eventId },
        { $set: updateFields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      return res.status(StatusCodes.OK).json({ message: updated });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this event",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

// delete livestock

const deleteEvent = async (req, res) => {
  const { farmlandId, livestockType, eventId } = req.params;

  try {
    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
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

    // get livestock model
    const eventCollection = getEventModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedEvent = await eventCollection.findOne({
      _id: eventId,
    });

    if (!fetchedEvent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "event not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedEvent.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      const deleteEntry = await eventCollection.findOneAndDelete({
        _id: eventId,
      });

      if (!deleteEntry) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "delete failed" });
      }

      return res
        .status(StatusCodes.OK)
        .json({ message: "event successfully deleted" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this event",
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error });
  }
};

// get livestock

const getEvent = async (req, res) => {
  const { farmlandId, livestockType, eventId } = req.params;
  const { search } = req.query;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const eventCollection = getEventModel(farmlandId, livestockType);

    let fetchedEvent;
    // Fetch event
    if (search) {
      fetchedEvent = await eventCollection.find({
        tagId: eventId,
      });
    } else {
      fetchedEvent = await eventCollection.findOne({
        tagId: eventId,
      });
    }

    if (!fetchedEvent) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Event not found",
      });
    }

    return res.status(StatusCodes.OK).json({ message: fetchedEvent });
  } catch (error) {
    console.error("Error fetching event:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const getAllEvents = async (req, res) => {
  const { farmlandId, livestockType } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const eventCollection = getEventModel(farmlandId, livestockType);

    // Fetch event
    const allEvents = await eventCollection.find();

    if (!allEvents) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Event not found",
      });
    }

    return res.status(StatusCodes.OK).json({ message: allEvents });
  } catch (error) {
    console.error("Error fetching event:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// lactation
const createLactation = async (req, res) => {
  const {
    tagId,
    milkYield,
    deliveryDate,
    weight,
    offspringNumber,
    observation,
    fat,
    snf,
    lactose,
    salt,
    protein,
    water,
  } = req.body;
  const { farmlandId, livestockType } = req.params;

  try {
    const { error } = lactatingLivestockJoiSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }

    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

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
      // Get the livestock model for this farmland
      const lactationCollection = getLactationModel(farmlandId, livestockType);

      if (tagId && tagId.includes(" ")) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Tag Id  should not contain spaces.",
        });
      }
      // Check for duplicate tagId within the same farmland collection
      const existingLivestock = await lactationCollection.findOne({
        tagId:tagId.toLowerCase(),
      });

      if (existingLivestock) {
        return res.status(400).json({
          message: "Tag Id already exists for this lactation profile",
        });
      }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new Livestock
      const newLactation = {
        inCharge: username,
        tagId,
        milkYield,
        deliveryDate: new Date(deliveryDate),
        weight,
        offspringNumber,
        observation,
        fat,
        snf,
        lactose,
        salt,
        protein,
        water,
      };

      await lactationCollection.create(newLactation);

      return res
        .status(StatusCodes.CREATED)
        .json({ message: "lactation created successfully" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Only farmLand Admin or Staffs can create a livestock.",
      });
    }

    //
  } catch (error) {
    console.log(error);
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "Duplicate TagId",
      });
      // Handle duplicate key error
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

// update lactation data

const updateLactation = async (req, res) => {
  const {
    tagId,
    milkYield,
    deliveryDate,
    weight,
    offspringNumber,
    observation,
    fat,
    snf,
    lactose,
    salt,
    protein,
    water,
  } = req.body;
  const { farmlandId, livestockType, lactationId } = req.params;

  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
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

    const lactationCollection = getLactationModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedlactation = await lactationCollection.findOne({
      _id: lactationId,
    });

    if (!fetchedlactation) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Laction record not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedlactation.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      if (tagId && tagId.includes(" ")) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Tag Id  should not contain spaces.",
        });
      }

      if (
        !tagId ||
        !milkYield ||
        deliveryDate === "Invalid date" ||
        !weight ||
        !offspringNumber ||
        !fat ||
        !snf ||
        !lactose ||
        !salt ||
        !protein ||
        !water
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Please, ensure you fill all fields!",
        });
      }

      // Check for duplicate tagId
      const existingTagId = await lactationCollection.findOne({ tagId });
      if (existingTagId && existingTagId._id.toString() !== lactationId) {
        return res.status(StatusCodes.CONFLICT).json({
          message: "Duplicate TagId",
        });
      }

      const updateFields = {};

      if (tagId !== undefined) updateFields["tagId"] = tagId.toLowerCase();
      if (milkYield !== undefined) updateFields["milkYield"] = milkYield;
      if (deliveryDate !== undefined)
        updateFields["deliveryDate"] = deliveryDate;
      if (weight !== undefined) updateFields["weight"] = weight;
      if (offspringNumber !== undefined)
        updateFields["offspringNumber"] = offspringNumber;
      if (observation !== undefined) updateFields["observation"] = observation;
      if (fat !== undefined) updateFields["fat"] = fat;
      if (snf !== undefined) updateFields["snf"] = snf;
      if (salt !== undefined) updateFields["salt"] = salt;
      if (protein !== undefined) updateFields["protein"] = protein;
      if (water !== undefined) updateFields["water"] = water;
      if (lactose !== undefined) updateFields["lactose"] = lactose;

      const updated = await lactationCollection.findOneAndUpdate(
        { _id: lactationId },
        { $set: updateFields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      return res.status(StatusCodes.OK).json({ message: updated });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this lactation record",
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(StatusCodes.CONFLICT).json({
        message: "Duplicate TagId",
      });
      // Handle duplicate key error
    }
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

// delete lactation
const deleteLactation = async (req, res) => {
  const { farmlandId, livestockType, lactationId } = req.params;

  try {
    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
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

    // get lactation model
    const lactationCollection = getLactationModel(farmlandId, livestockType);

    // Fetch lactation
    const fetchedlactation = await lactationCollection.findOne({
      _id: lactationId,
    });

    if (!fetchedlactation) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "lactation record not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedlactation.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      const deleteentry = await lactationCollection.findOneAndDelete({
        _id: lactationId,
      });

      if (!deleteentry) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "operation failed" });
      }

      return res
        .status(StatusCodes.OK)
        .json({ message: "lactation record successfully deleted" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this lactation record",
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error });
  }
};

// get lactation
const getLactation = async (req, res) => {
  const { farmlandId, livestockType, lactationId } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const lactationCollection = getLactationModel(farmlandId, livestockType);

    // Fetch livestock
    const fetchedlactation = await lactationCollection.findOne({
      tagId: lactationId,
    });

    if (!fetchedlactation) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Lactation record not found",
      });
    }

    return res.status(StatusCodes.OK).json({ message: fetchedlactation });
  } catch (error) {
    console.error("Error fetching livestock:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const getAllLactations = async (req, res) => {
  const { farmlandId, livestockType } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const lactationCollection = getLactationModel(farmlandId, livestockType);

    const allLactations = await lactationCollection.find();

    return res.status(StatusCodes.OK).json({ message: allLactations });
  } catch (error) {
    console.error("Error fetching lactation:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// pregnancy functions
const createPregnancy = async (req, res) => {
  const { breed, tagId, status, breedingDate, gestationPeriod, remark } =
    req.body;
  const { farmlandId, livestockType } = req.params;

  try {
    const { error } = pregnancyJoiSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }

    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check for pregnancy status
    if (!["Yes", "No"].includes(status)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid pregnancy status type." });
    }

    // check if user is a admin or staff in the farmland
    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (isStaffOrAdmin) {
      // Get the pregnancy model for this farmland
      const pregnancyCollection = getPregnancyModel(farmlandId, livestockType);

      // if (tagId && tagId.includes(" ")) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     message: "PregnancyId  should not contain spaces.",
      //   });
      // }

      // Check for duplicate Id within the same farmland collection
      const existingPregnancy = await pregnancyCollection.findOne({
        tagId:tagId.toLowerCase(),
      });
      if (existingPregnancy) {
        return res.status(400).json({
          message: "Tag Id already exists for this livestock type",
        });
      }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new Livestock
      const newLactation = {
        inCharge: username,
        breed,
        tagId,
        status,
        breedingDate: new Date(breedingDate),
        gestationPeriod,
        remark,
      };

      await pregnancyCollection.create(newLactation);

      return res
        .status(StatusCodes.CREATED)
        .json({ message: "Pregnancy record created successfully" });
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

// update lactation data

const updatePregnancy = async (req, res) => {
  const { breed, tagId, status, breedingDate, gestationPeriod, remark } =
    req.body;
  const { farmlandId, livestockType, pregnancyId } = req.params;

  try {
    const { error } = pregnancyJoiSchema.validate(req.body);
    if (error) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: error.details[0].message,
      });
    }
    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    // check for pregnancy status
    if (!["Yes", "No"].includes(status)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid pregnancy status type." });
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

    const pregnancyCollection = getPregnancyModel(farmlandId, livestockType);

    // Fetch pregnant livestock

    const fetchedPregnantLivestock = await pregnancyCollection.findOne({
      _id: pregnancyId,
    });

    if (!fetchedPregnantLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "pregnant record not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedPregnantLivestock.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      // if (tagId && tagId.includes(" ")) {
      //   return res.status(StatusCodes.BAD_REQUEST).json({
      //     message: "PregnancyId  should not contain spaces.",
      //   });
      // }

      if (
        !breed ||
        !tagId ||
        !status ||
        breedingDate === "Invalid date" ||
        !gestationPeriod
      ) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Please, ensure you fill all fields!",
        });
      }

      const updateFields = {};

      if (tagId !== undefined) updateFields["tagId"] = tagId.toLowerCase();
      if (breed !== undefined) updateFields["breed"] = breed;
      if (status !== undefined) updateFields["status"] = status;
      if (breedingDate !== undefined)
        updateFields["breedingDate"] = breedingDate;
      if (gestationPeriod !== undefined)
        updateFields["gestationPeriod"] = gestationPeriod;
      if (remark !== undefined) updateFields["remark"] = remark;

      Object.assign(fetchedPregnantLivestock, updateFields);
      await fetchedPregnantLivestock.save();

      return res
        .status(StatusCodes.OK)
        .json({ message: fetchedPregnantLivestock });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this lactation record",
      });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(StatusCodes.CONFLICT)
        .json({ message: "Duplicate Tag Id" });
      // Handle duplicate key error
    }
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

// delete lac
const deletePregnancy = async (req, res) => {
  const { farmlandId, livestockType, pregnancyId } = req.params;

  try {
    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
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

    const pregnancyCollection = getPregnancyModel(farmlandId, livestockType);

    // Fetch pregnant livestock

    const fetchedPregnantLivestock = await pregnancyCollection.findOne({
      _id: pregnancyId,
    });

    if (!fetchedPregnantLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "pregnant record not found",
      });
    }

    // Check for livestock ownership
    if (
      fetchedPregnantLivestock.inCharge === requester.username ||
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id)
    ) {
      const deleteentry = await pregnancyCollection.findOneAndDelete({
        _id: pregnancyId,
      });

      if (!deleteentry) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "operation failed" });
      }

      return res
        .status(StatusCodes.OK)
        .json({ message: "Pregnancy record successfully deleted" });
    } else {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You are not in charge of this lactation record",
      });
    }
  } catch (error) {
    console.log(error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error });
  }
};

// get pregnancy
const getPregnancy = async (req, res) => {
  const { farmlandId, livestockType, pregnancyId } = req.params;
  try {
    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Invalid livestock type" });
    }

    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    // check for farmalnd
    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const pregnancyCollection = getPregnancyModel(farmlandId, livestockType);

    // Fetch pregnant livestock

    const fetchedPregnantLivestock = await pregnancyCollection.findOne({
      tagId: pregnancyId,
    });

    if (!fetchedPregnantLivestock) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "pregnant record not found",
      });
    }

    return res
      .status(StatusCodes.OK)
      .json({ message: fetchedPregnantLivestock });
  } catch (error) {
    console.error("Error fetching livestock:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

const getAllPregnancies = async (req, res) => {
  const { farmlandId, livestockType, pregnancyId } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid livestock type" });
  }

  try {
    const requester = req.user;
    const farmlandAdmin = farmlandInDb.admin;

    // Check if admin or workers are allowed into the farmland
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmlandAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "You do not have permission to access this farmland",
      });
    }

    const pregnancyCollection = getPregnancyModel(farmlandId, livestockType);

    const allPregnancies = await pregnancyCollection.find();

    return res.status(StatusCodes.OK).json({ message: allPregnancies });
  } catch (error) {
    console.error("Error fetching lactation:", error); // Log the error for debugging
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: error.message });
  }
};

// get module counts

const getAllModuleCounts = async (req, res) => {
  const { farmlandId } = req.params;
  const livestockNames = ["cattle", "sheep", "pig", "goat"];

  try {
    const farmlandInDb = await farmLandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Farmland not found" });
    }

    const requester = req.user;
    const farmalndAdmin = farmlandInDb.admin;
    const isStaffOrAdmin =
      mongoose.Types.ObjectId(farmalndAdmin).equals(requester.id) ||
      farmlandInDb.staffs.includes(requester.id);

    if (!isStaffOrAdmin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: "Only farmLand's Admin or Staff can access this Farmland.",
      });
    }

    //all module models
    //  const livestock = getLivestockModel(farmlandId, livestockType);
    //  const quarantineModel = getQuarantinedModel(farmlandId, livestockType);
    //  const FinanceModel = getFinanceModel(
    //    farmlandId,
    //    livestockType,
    //    financeType
    //  );
    //  const eventModel = getEventModel(farmlandId, livestockType);
    //  const lactationModel = getLactationModel(farmlandId, livestockType);
    //  const pregnancyModel = getPregnancyModel(farmlandId, livestockType);

    const fetchModuleCount = async (
      modelFunc,
      livestockType,
      additionalParam = ""
    ) => {
      const model = modelFunc(farmlandId, livestockType, additionalParam);
      const count = await model.countDocuments({});
      return { name: livestockType, data: count };
    };

    const results = await Promise.all(
      livestockNames.map(async (livestockName) => {
        const livestockCount = await fetchModuleCount(
          getLivestockModel,
          livestockName
        );
        const eventCount = await fetchModuleCount(getEventModel, livestockName);
        const pregnancyCount = await fetchModuleCount(
          getPregnancyModel,
          livestockName
        );
        const lactationCount = await fetchModuleCount(
          getLactationModel,
          livestockName
        );
        const quarantineCount = await fetchModuleCount(
          getQuarantinedModel,
          livestockName
        );
        const incomeCount = await fetchModuleCount(
          getFinanceModel,
          livestockName,
          "income"
        );
        const expenseCount = await fetchModuleCount(
          getFinanceModel,
          livestockName,
          "expense"
        );

        return {
          livestockCount,
          eventCount,
          pregnancyCount,
          lactationCount,
          quarantineCount,
          incomeCount,
          expenseCount,
        };
      })
    );

    res.status(StatusCodes.OK).json({ message: results });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

module.exports = { getAllModuleCounts };

module.exports = {
  // farmland
  getFarmlandStaffs,
  getFarmlandrequests,
  farmLandDetails,
  processFarmlandRequest,

  // livestocks
  createLivestock,
  updateLivestock,
  deleteLivestock,
  getLivestock,
  getAllLivestocks,
  quarantine,
  getAllQuarantine,
  getAQuarantine,

  // Finance
  createFinance,
  updateFinance,
  deleteFinance,
  getFinance,
  getAllFinances,

  // event
  createEvent,
  updateEvent,
  deleteEvent,
  getEvent,
  getAllEvents,

  createLactation,
  updateLactation,
  deleteLactation,
  getLactation,
  getAllLactations,

  createPregnancy,
  updatePregnancy,
  deletePregnancy,
  getPregnancy,
  getAllPregnancies,

  // module entries count
  getAllModuleCounts,
  sentRequest,
};
