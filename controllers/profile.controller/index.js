const express = require("express");
const { StatusCodes } = require("http-status-codes");
const { BadRequestError, UnauthenticatedError } = require("../../errors");
const staffModel = require("../../models/staff.model");
const adminModel = require("../../models/admin.model");
const mongoose = require("mongoose");

// edit admin/staff profile
const editProfile = async (req, res) => {
  const { userId } = req.params;
  const { email, username, password } = req.body;
  const requesterId = req.user.id;

  try {
    let user;
    let isAdmin = false;

    // Check if the user is a farm worker or admin
    user = await staffModel.findOne({ username: userId });
    if (!user) {
      user = await adminModel.findOne({ username: userId });
      if (!user) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "User not found" });
      }
      isAdmin = true;
    }

    // check if caller is allowed to make the request
    if (!mongoose.Types.ObjectId(requesterId).equals(user._id)) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Please login into your account to proceed" });
    }

    // Check for the availability of the email and username
    if (username) {
      const existingUserByUsername =
        (await adminModel.findOne({ username })) ||
        (await staffModel.findOne({ username }));
      if (
        existingUserByUsername &&
        !existingUserByUsername._id.equals(user._id)
      ) {
        return res.status(StatusCodes.CONFLICT).json({
          message: "Username is already taken, please choose another username",
        });
      }
    }

    if (email) {
      const existingUserByEmail =
        (await adminModel.findOne({ email })) ||
        (await staffModel.findOne({ email }));
      if (existingUserByEmail && !existingUserByEmail._id.equals(user._id)) {
        return res.status(StatusCodes.CONFLICT).json({
          message: "Email is already taken, please choose another email",
        });
      }
    }

    // Update data
    const updateData = {};
    if (username !== undefined) updateData["username"] = username;
    if (email !== undefined) updateData["email"] = email;
    if (password !== undefined) updateData["password"] = password;

    let updatedProfile;
    if (isAdmin) {
      updatedProfile = await adminModel.findOneAndUpdate(
        { _id: user._id },
        { $set: updateData },
        { new: true }
      );
    } else {
      updatedProfile = await staffModel.findOneAndUpdate(
        { _id: user._id },
        { $set: updateData },
        { new: true }
      );
    }

    res.status(StatusCodes.OK).json({ message: updatedProfile });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

//  edit admin/staff profile
const getProfile = async (req, res) => {
  const { userId } = req.params;
  const requester = req.user;

  try {
    let user;
    let isAdmin = false;

    // Check if the user is a farm worker or admin
    user = await staffModel.findOne({ username: userId });
    if (!user) {
      user = await adminModel.findOne({ username: userId });
      if (!user) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ message: "User not found" });
      }
      isAdmin = true;
    }

    // check if caller is allowed to make the request
    if (!mongoose.Types.ObjectId(requester.id).equals(user._id)) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Please login into your account to proceed" });
    }

    res.status(StatusCodes.OK).json({
      message: {
        _id: user._id,
        isAdmin: user.isAdmin,
        username: user.username,
        email: user.email,
        staffAt: user.staffAt,
        status: user.status,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
};

module.exports = { getProfile, editProfile };
