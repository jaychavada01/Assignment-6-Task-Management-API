const jwt = require("jsonwebtoken");
const { STATUS_CODES } = require("../config/constant");
const User = require("../models/user");

exports.authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Unauthorized, token missing!" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ? Finding the user
    const user = await User.findOne({ where: { id: decoded.id } });
    if (!user) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Unauthorized user!" });
    }

    // ? Check if token is blacklisted OR accessToken is null
    if (!user.accessToken || user.blacklistedTokens.includes(token)) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: "Token is Blacklisted or Invalid!" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res
      .status(STATUS_CODES.UNAUTHORIZED)
      .json({ message: "Unauthorized Access!" });
  }
};
