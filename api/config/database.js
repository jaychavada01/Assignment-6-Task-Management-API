const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD, // This must be a valid string
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    logging: process.env.NODE_ENV === "test" ? false : console.log,
    // logging: false,
  }
);

module.exports = { sequelize };
