const express = require("express");
const { signupUser, loginUser, logoutUser, forgotPassword, resetPassword, changePassword } = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/signup", signupUser)
router.post("/login", loginUser)
router.post("/logout", authenticate,logoutUser)

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/change-password", authenticate, changePassword);
module.exports = router;
