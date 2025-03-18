require("dotenv").config({ path: `${process.cwd()}/api/.env` });
require("./config/cron");

const express = require("express");
const { sequelize } = require("./config/database");
const { STATUS_CODES } = require("./config/constant");
const userRoute = require("./routes/userRoute.js");
const taskRoute = require("./routes/taskRoute.js");
const commentRoute = require("./routes/commentRoute.js");
const i18nMiddleware = require("./middleware/i18Next.js");
const swaggerDocs = require("./config/swagger.js");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(i18nMiddleware);

// Swagger API Documentation
swaggerDocs(app);

// Routes
app.use("/user", userRoute);
app.use("/task", taskRoute);
app.use("/comment", commentRoute);

// Handle invalid routes
app.use("*", (req, res) => {
  res
    .status(STATUS_CODES.BAD_REQUEST)
    .json({ message: req.t("common.invalid_routes") });
});

module.exports = app;
