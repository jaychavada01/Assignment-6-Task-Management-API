const { STATUS_CODES, VALIDATION_RULES } = require("../config/constant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Validator = require("validatorjs");
const User = require("../models/user");
const sendEmail = require("../utills/mailer");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

const generateToken = async (user) => {
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });
  user.accessToken = token;
  await user.save();
  return token;
};

const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
    return false;
  }
  return true;
};

exports.signupUser = async (req, res, next) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.SIGNUP, res)) return;

    const { fullName, email, password } = req.body;

    //? Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser)
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "User already exists" });

    // ? Create new user
    const newUser = await User.create({ fullName, email, password });

    const token = await generateToken(newUser);

    const htmlContent = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
    <h2 style="color: #333;">Hey...</h2>
    <p>Hello <strong>${newUser.fullName}</strong>, Welcome to Task Management Tool</p>
    <p>We received details of you. we are welcoming you to onboard!</p>
  </div>`;

    // Send reset email with token
    await sendEmail(email, "Welcomt to Our platform!", htmlContent);

    res
      .status(STATUS_CODES.CREATED)
      .json({ message: "Signup Successfull!", accessToken: token });
  } catch (error) {
    console.log(error.message);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: "Error in signup!" });
  }
};
exports.loginUser = async (req, res, next) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.LOGIN, res)) return;

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "User not found" });

    if (!(await bcrypt.compare(password, user.password))) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Invalid credentials" });
    }

    // **Clear blacklisted tokens upon successful login**
    user.blacklistedTokens = [];
    await user.save();

    const token = await generateToken(user);

    res.status(STATUS_CODES.SUCCESS).json({
      message: "User logged in successfully!",
      accessToken: token,
    });
  } catch (error) {
    console.log(error.message);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: "Error in login!" });
  }
};

exports.logoutUser = async (req, res) => {
  try {
    const user = req.user;
    const token = req.headers.authorization.split(" ")[1];

    // ? If token is already blacklisted, prevent multiple logouts
    if (user.blacklistedTokens.includes(token)) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Already Logged Out!" });
    }

    // ? Add token to blacklist array
    user.blacklistedTokens = [...(user.blacklistedTokens || []), token];
    user.accessToken = null; // ? Clear active token
    await user.save();

    res.status(STATUS_CODES.SUCCESS).json({ message: "Logout Successful!" });
  } catch (error) {
    console.log(error.message);
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: "Error in logout!" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.FORGET_PASSWORD, res))
      return;

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "User not found!" });

    // Generate unique token and expiry time (10 min)
    const forgetPasswordToken = uuidv4();
    const forgetPasswordTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Update user with reset token and expiry
    user.forgetPasswordToken = forgetPasswordToken;
    user.forgetPasswordTokenExpiry = forgetPasswordTokenExpiry;

    // Ensure changes are saved in the DB
    await user.save();

    // Email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Request</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>Click the link below to reset your password:</p>
        <a href="${process.env.CLIENT_URL}/reset-password/${forgetPasswordToken}" 
           style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none;">
           Reset Password
        </a>
        <p>This link will expire in 15 minutes.</p>
      </div>
    `;

    // Send Email
    await sendEmail(user.email, "Reset Your Password", htmlContent);

    res.status(STATUS_CODES.SUCCESS).json({
      message: "Reset link sent! Check your email.",
    });
  } catch (error) {
    console.log(error.message);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error sending reset email!" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.RESET_PASSWORD, res))
      return;

    const { email, token, newPassword } = req.body;

    // Find user with matching email, valid token, and non-expired token
    const user = await User.findOne({
      where: {
        email, // Ensures token belongs to the correct user
        forgetPasswordToken: token,
        forgetPasswordTokenExpiry: { [Op.gt]: new Date() }, // Ensures token is still valid
      },
    });

    if (!user) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid Token!" });
    }

    // Update password & clear reset token
    user.password = newPassword;
    user.forgetPasswordToken = null;
    user.forgetPasswordTokenExpiry = null;
    await user.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Password reset successful!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in resetpassword!" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.CHANGE_PASSWORD, res))
      return;

    const { oldPassword, newPassword } = req.body;
    const user = res.user;

    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: "User not found!" });
    }

    //? Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Incorrect Old Password!" });
    }

    if (oldPassword == newPassword) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: "Entered old password! Use unique & new One." });
    }

    // Update to new password
    user.password = newPassword;

    // Optionally: Blacklist previous tokens (forcing re-login)
    user.accessToken = null;

    const token = req.headers.authorization.split(" ")[1];
    user.blacklistedTokens.push(token);

    await user.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: "Password changed successfully!" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in Change password" });
  }
};
