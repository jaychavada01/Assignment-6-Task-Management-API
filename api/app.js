require("dotenv").config({ path: `${process.cwd()}/api/.env` });
require("./config/cron");

const express = require("express");
const { sequelize } = require("./config/database");
const { STATUS_CODES } = require("./config/constant");
const userRoute = require("./routes/userRoute.js");
const taskRoute = require("./routes/taskRoute.js");

const app = express();

// ? middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//? Routes
app.use("/api/user", userRoute);
app.use("/api/task", taskRoute);

//? Handle invalid routes
app.use("*", (req, res) => {
  res.status(STATUS_CODES.BAD_REQUEST).json({ message: "Invalid Route!" });
});

// ? sync sequelize and start server
sequelize.sync({ alter: true }).then(() => {
  console.log("Database Synced!");
  app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
  });
});
