const dotenv = require("dotenv");

dotenv.config();

const {Sequelize} = require("sequelize")

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: process.env.DB_DIALECT,
      logging: false, // Set to true to see SQL queries in the console
    }
  );
  
  module.exports = { sequelize };