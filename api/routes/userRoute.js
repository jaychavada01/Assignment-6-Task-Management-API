const express = require("express");
const {
  signupUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  changePassword,
  deleteUser,
  updateUser,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         fullName:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *       required:
 *         - fullName
 *         - email
 *         - password
 *     LoginCredentials:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *       required:
 *         - email
 *         - password
 *     PasswordReset:
 *       type: object
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         token:
 *           type: string
 *           description: Password reset token
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
 *       required:
 *         - email
 *         - token
 *         - newPassword
 *     PasswordChange:
 *       type: object
 *       properties:
 *         oldPassword:
 *           type: string
 *           format: password
 *           description: Current password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password
 *       required:
 *         - oldPassword
 *         - newPassword
 *      DeleteUser:
 *        type: object
 *        properties:
 *
 */

/**
 * @swagger
 * /user/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input or user already exists
 */
router.post("/signup", signupUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /user/logout:
 *   post:
 *     summary: Log out the user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized or user already logged out
 */
router.post("/logout", authenticate, logoutUser);

/**
 * @swagger
 * /user/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *             required:
 *               - email
 *     responses:
 *       200:
 *         description: Reset link sent to email
 *       404:
 *         description: User not found
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordReset'
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post("/reset-password", resetPassword);

/**
 * @swagger
 * /user/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PasswordChange'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Unauthorized or incorrect old password
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /user/delete:
 *   delete:
 *     summary: Delete the authenticated user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted successfully
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: User not found or already deleted
 *       500:
 *         description: Internal server error
 */
router.delete("/delete", authenticate, deleteUser);

/**
 * @swagger
 * /user/update:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Updated full name of the user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email address of the user
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: No changes detected in the user data
 *       401:
 *         description: Unauthorized - User not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.put("/update", authenticate, updateUser);

module.exports = router;
