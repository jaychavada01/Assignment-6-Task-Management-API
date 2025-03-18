const { STATUS_CODES, VALIDATION_RULES } = require("../config/constant");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Validator = require("validatorjs");
const User = require("../models/user");
const sendEmail = require("../utills/mailer");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const {
  sendUserCreationNotification,
  sendUpdationNotification,
  sendDeletionNotification,
} = require("../utills/notification");

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

exports.signupUser = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.SIGNUP, res)) return;

    const { fullName, email, password } = req.body;
    const createdBy = req.user?.id || null;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: req.t("auth.user_exists") });
    }

    // Create new user and generate token
    const newUser = await User.create({ fullName, email, password, createdBy });
    const token = await generateToken(newUser);

    // Send welcome email asynchronously
    sendEmail(
      email,
      "Welcome to Our Platform!",
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; padding: 20px; border-radius: 8px;">
          <h2 style="color: #333;">Hey...</h2>
          <p>Hello <strong>${fullName}</strong>, Welcome to Task Management Tool</p>
          <p>We received your details and are excited to have you on board!</p>
      </div>`
    ).catch((err) => console.error("Email sending error:", err));

    const user = await User.findByPk(newUser.id);
    if (user?.fcmtoken) {
      await sendUserCreationNotification(user.fcmtoken, fullName);
    }

    res
      .status(STATUS_CODES.CREATED)
      .json({ message: req.t("auth.signup_success"), accessToken: token });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

exports.loginUser = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.LOGIN, res)) return;

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("auth.no_user") });

    if (!(await bcrypt.compare(password, user.password))) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: req.t("auth.invalid_data") });
    }

    // **Clear blacklisted tokens upon successful login**
    user.blacklistedTokens = [];
    await user.save();

    const token = await generateToken(user);

    res.status(STATUS_CODES.SUCCESS).json({
      message: req.t("auth.login_success"),
      accessToken: token,
    });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
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
        .json({ message: req.t("auth.already_logout") });
    }

    // ? Add token to blacklist array
    user.blacklistedTokens = [...(user.blacklistedTokens || []), token];
    user.accessToken = null; // ? Clear active token
    user.fcmToken = null; // ? Clear fcm tokens
    await user.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("auth.logout_success") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user
    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("auth.no_user") });
    }

    // Soft delete: update isDeleted, deletedBy, and deletedAt fields
    await User.update(
      {
        isDeleted: true,
        deletedBy: userId,
        deletedAt: new Date(),
      },
      { where: { id: userId } }
    );

    // sent notificaiton
    if (user?.fcmtoken) {
      await sendDeletionNotification(user.fcmtoken, fullName);
    }

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("auth.delete_success") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.FORGET_PASSWORD, res))
      return;

    const { email } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("auth.no_user") });
    }

    // Generate and save reset token
    user.forgetPasswordToken = uuidv4();
    user.forgetPasswordTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min expiry
    await user.save();

    // Email content with user email for assurance
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Hello <strong>${user.fullName}</strong>,</p>
        <p>A password reset request was made for the account associated with this email: <strong>${user.email}</strong>.</p>
        <p>Click the link below to reset your password:</p>
        <a href="/reset-password/${user.forgetPasswordToken}" 
          style="display: inline-block; background-color: #007bff; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
          Reset Password
        </a>
        <p>This link will expire in <strong>15 minutes</strong>.</p>
      </div>
    `;

    // Send Email
    await sendEmail(user.email, "Reset Your Password", htmlContent);

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("auth.reset_link") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
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
        .json({ message: req.t("auth.invalid_token") });
    }

    // Update password & clear reset token
    user.password = newPassword;
    user.forgetPasswordToken = null;
    user.forgetPasswordTokenExpiry = null;
    await user.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("auth.reset_success") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

exports.changePassword = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.CHANGE_PASSWORD, res))
      return;

    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id; // Extracted from authenticated token

    const user = await User.findByPk(userId);
    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("auth.no_user") });
    }

    //? Verify old password
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: req.t("auth.incorrect_old_password") });
    }

    if (oldPassword == newPassword) {
      return res
        .status(STATUS_CODES.FORBIDDEN)
        .json({ message: req.t("auth.same_old_password") });
    }

    // Update to new password
    user.password = newPassword;

    const token = req.headers.authorization.split(" ")[1];
    user.blacklistedTokens.push(token);

    await user.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("auth.password_changed") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

exports.updateUser = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.UPDATE_USER, res)) return;

    const { fullName, email } = req.body;
    const userId = req.user.id;

    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("auth.no_user") });
    }

    // Check if the provided fields are the same as existing ones
    const isFullNameSame = fullName === user.fullName;
    const isEmailSame = email === user.email;

    if (isFullNameSame && isEmailSame) {
      return res
        .status(STATUS_CODES.SUCCESS)
        .json({ message: req.t("auth.same_data") });
    }

    // Update fields only if they have changed
    if (!isFullNameSame) user.fullName = fullName;
    if (!isEmailSame) user.email = email;

    if (user?.fcmtoken) {
      await sendUpdationNotification(user.fcmtoken, fullName);
    }

    user.updatedBy = userId;
    await user.save();

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("auth.update_success") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};
