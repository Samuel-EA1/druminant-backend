const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const adminModel = require("../../models/admin.model");
const staffModel = require("../../models/staff.model");
const tokenModel = require("../../models/token.model");
const { STATUS_CODES } = require("http");
const { StatusCodes } = require("http-status-codes");

const clientURL = process.env.CLIENT_URL;

const requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  try {
    const user =
      (await adminModel.findOne({ email })) ||
      (await staffModel.findOne({ email }));

    if (!user)
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not found" });

    let token = await tokenModel.findOne({ userId: user._id });
    if (token) await token.deleteOne();

    let resetToken = crypto.randomBytes(32).toString("hex");
    const hash = await bcrypt.hash(resetToken, 10);

    await new tokenModel({
      userId: user._id,
      token: hash,
      createdAt: Date.now(),
    }).save();

    const link = `${clientURL}/api/v1/auth/passwordReset?token=${resetToken}&userId=${user._id}`;

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or another email service
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset",
      text: `Click on this link to reset your password: ${link}`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "Password reset link sent to your email account" });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { userId, token, newPassword } = req.body;
    const passwordResetToken = await tokenModel.findOne({ userId });

    if (!passwordResetToken) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: "Invalid or expired password reset token" });
    }

    const isValid = await bcrypt.compare(token, passwordResetToken.token);

    if (!isValid) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .send({ message: "Invalid or expired password reset token" });
    }

    // const hash = await bcrypt.hash(newPassword, 10);

    const user =
      (await adminModel.findById(userId)) ||
      (await staffModel.findById(userId));

    user.password = newPassword;
    await user.save();
    await passwordResetToken.deleteOne();

    // Send email
    const transporter = nodemailer.createTransport({
      service: "Gmail", // or another email service
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password reset successful",
      text: `You have succesfully reseted your account password`,
    };

    await transporter.sendMail(mailOptions);

    return res
      .status(StatusCodes.CREATED)
      .json({ message: "Password reset successful" });
  } catch (error) {
    console.log(error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error });
  }
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
