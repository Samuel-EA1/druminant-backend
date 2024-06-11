const farmLandModel = require("../../models/farmland.model");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const farmlandModel = require("../../models/farmland.model");
const staffModel = require("../../models/staff.model");
const adminModel = require("../../models/admin.model");
const Joi = require("joi");

const {
  getQuarantinedModel,
  getLivestockModel,
  getFinanceModel,
} = require("../../models/getDynameModels");
const {
  joiLivestockSchema,
  joiFinanceSchema,
} = require("./farmValidation/joivalidations");

// Joi schema for quarantine schema
const quarantineJoiSchema = Joi.object({
  quarantine_date: Joi.date().required(),
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

    if (accepted.length < 1) {
      return res
        .status(StatusCodes.OK)
        .json({ message: "No staffs working on this farmland" });
    }

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
      return res
        .status(StatusCodes.OK)
        .json({ message: "No requests on this farmland" });
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
    birthdate,
    sex,
    tagId,
    originStatus,
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
        Error: error.details[0].message,
      });
    }

    // check if the type is allowed
    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid livestock type" });
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
      const Livestock = getLivestockModel(farmlandId, livestockType);

      // Check for duplicate tagId within the same farmland collection
      const existingLivestock = await Livestock.findOne({
        tagId,
      });
      if (existingLivestock) {
        return res
          .status(400)
          .json({ error: "Tag ID already exists for this farmland" });
      }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new cattle
      const newCattle = {
        inCharge: username,
        breed,
        birthdate: new Date(birthdate),
        sex,
        tagId,
        tagLocation,
        originStatus,
        weight,
        status,
        remark: remark,
      };

      const newLivestock = new Livestock(newCattle);
      await newLivestock.save();

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
  const { farmlandId, livestockId, livestockType } = req.params;
  const {
    breed,
    birthdate,
    sex,
    tagId,
    tagLocation,
    weight,
    status,
    originStatus,
    remark,
  } = req.body;

  tagId;
  try {
    // Fetch farmland
    const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

    if (!farmlandInDb) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ Error: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid livestock type" });
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

      if (breed !== undefined) updateFields["breed"] = breed;
      if (birthdate !== undefined) updateFields["birthdate"] = birthdate;
      if (sex !== undefined) updateFields["sex"] = sex;
      if (tagId !== undefined) updateFields["tagId"] = tagId;
      if (tagLocation !== undefined) updateFields["tagLocation"] = tagLocation;
      if (weight !== undefined) updateFields["weight"] = weight;
      if (status !== undefined) updateFields["status"] = status;
      if (originStatus !== undefined)
        updateFields["originStatus"] = originStatus;
      if (remark !== undefined) updateFields["remark"] = remark;

      const updated = await livestock.findOneAndUpdate(
        { tagId: livestockId },
        { $set: updateFields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      return res.status(StatusCodes.OK).json(updated);
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
        .json({ error: "Invalid livestock type" });
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
      .json({ error: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid livestock type" });
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
      .json({ error: error.message });
  }
};

const getAllLivestocks = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;

  // Fetch farmland
  const farmlandInDb = await farmlandModel.findOne({ farmland: farmlandId });

  if (!farmlandInDb) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Farmland not found" });
  }

  if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid livestock type" });
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
      .json({ error: error.message });
  }
};

const quarantine = async (req, res) => {
  const { farmlandId, livestockType, livestockId } = req.params;
  const { action, quarantine_date, reason } = req.body;

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
        .json({ Error: "FarmLand not found" });
    }

    if (!["cattle", "sheep", "pig", "goat"].includes(livestockType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid livestock type" });
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
          quarantine_date,
          reason,
        });

        if (error) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            Error: error.details[0].message,
          });
        }

        // push livestock to quarantine model

        const newQuarantine = {
          inCharge: isReleased.inCharge,
          quarantine_date: new Date(quarantine_date),
          reason: reason,
          breed: isReleased.breed,
          birthdate: isReleased.birthdate,
          sex: isReleased.sex,
          tagId: isReleased.tagId,
          tagLocation: isReleased.tagLocation,
          originStatus: isReleased.originStatus,
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
          birthdate: isQuarantined.birthdate,
          sex: isQuarantined.sex,
          tagId: isQuarantined.tagId,
          tagLocation: isQuarantined.tagLocation,
          originStatus: isQuarantined.originStatus,
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
        Error: error.details[0].message,
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
        .json({ error: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid finance type" });
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
      const FinanceModel = getFinanceModel(
        farmlandId,
        livestockType,
        financeType
      );

      // Check for duplicate financeId within the same farmland collection
      const existingFinance = await FinanceModel.findOne({
        financeEntryId,
      });
      if (existingFinance) {
        return res.status(400).json({
          error: "Finance Id already exists for this farmland and finance type",
        });
      }

      const { username } = requester.isAdmin
        ? await adminModel.findOne({ _id: requester.id })
        : await staffModel.findOne({ _id: requester.id });

      // new cattle
      const newFinance = {
        inCharge: username,
        financeEntryId,
        paymentmethod,
        desc,
        transactionDate: new Date(transactionDate),
        amount,
      };

      // create finance document

      await FinanceModel.create(newFinance);

      return res
        .status(StatusCodes.CREATED)
        .json({ message: "Finance created successfully" });
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

// update finance
const updateFinance = async (req, res) => {
  const { desc, transactionDate, amount, paymentmethod, financeEntryId } =
    req.body;
  const { farmlandId, livestockType, financeType, financeId } = req.params;

  try {
    // const { error } = joiFinanceSchema.validate(req.body);
    // if (error) {
    //   return res.status(StatusCodes.BAD_REQUEST).json({
    //     Error: error.details[0].message,
    //   });
    // }

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
        .json({ error: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid finance type" });
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
        financeEntryId: financeId,
      });

      if (!existingFinance) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `${financeType} not found`,
        });
      }

      if (desc !== undefined) updateFields["desc"] = desc;
      if (transactionDate !== undefined)
        updateFields["transactionDate"] = transactionDate;
      if (amount !== undefined) updateFields["amount"] = amount;
      if (financeEntryId !== undefined)
        updateFields["financeEntryId"] = financeEntryId;
      if (paymentmethod !== undefined)
        updateFields["paymentmethod"] = paymentmethod;

      const updated = await FinanceModel.findOneAndUpdate(
        { financeEntryId: financeId },
        { $set: updateFields },
        { new: true }
      );

      if (!updated) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "Update failed" });
      }

      return res.status(StatusCodes.OK).json(updated);
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
        .json({ error: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid finance type" });
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
        financeEntryId: financeId,
      });

      if (!existingFinance) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `${financeType} not found`,
        });
      }

      // delete document

      const deleteentry = await FinanceModel.findOneAndDelete({
        financeEntryId: financeId,
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
        message: "Only farmLand Admin or Staffs can create a livestock.",
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
        .json({ error: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid finance type" });
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
        financeEntryId: financeId,
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
        .json({ error: "Invalid livestock type" });
    }

    // check if the finance is allowed
    if (!["income", "expense"].includes(financeType)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Invalid finance type" });
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

      const allFinance = await FinanceModel.find();

      return res.status(StatusCodes.OK).json({ message: allFinance });
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

  // Finance
  createFinance,
  updateFinance,
  deleteFinance,
  getFinance,
  getAllFinances,
};
