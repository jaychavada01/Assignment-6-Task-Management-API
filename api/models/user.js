const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");
const bcrypt = require("bcryptjs");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.STRING,
      allowNull: true, // Store active token for better security handling
    },
    forgetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true, // Store
    },
    forgetPasswordTokenExpiry: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    blacklistedTokens: {
      type: DataTypes.JSON, // Store blacklisted tokens as an array of strings
      allowNull: true,
      defaultValue: [],
    },
    fcmToken: {
      type: DataTypes.STRING,
      allowNull: true, // Store
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before creating a user
User.beforeCreate(async (user) => {
  user.password = await bcrypt.hash(user.password, 10);
});

User.beforeUpdate(async (user) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

module.exports = User;
