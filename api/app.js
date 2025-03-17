require("dotenv").config({ path: `${process.cwd()}/api/.env` });
require("./config/cron");

const express = require("express");
const { sequelize } = require("./config/database");
const { STATUS_CODES } = require("./config/constant");
const userRoute = require("./routes/userRoute.js");
const taskRoute = require("./routes/taskRoute.js");
const i18nMiddleware = require("./middleware/i18Next.js");
const swaggerDocs = require("./config/swagger.js");

const app = express();

// ? middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(i18nMiddleware);

//? Serve Swagger API Documentation
swaggerDocs(app);

//? Routes
app.use("/user", userRoute);
app.use("/task", taskRoute);
app.use("/comment", taskRoute);

//? Handle invalid routes
app.use("*", (req, res) => {
  res
    .status(STATUS_CODES.BAD_REQUEST)
    .json({ message: req.t("common.invalid_routes") });
});

// ? sync sequelize and start server
sequelize.sync({ alter: true }).then(() => {
  console.log("Database Synced!");
  app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
    console.log(`Swagger Docs available at: http://localhost:${process.env.PORT}/api-docs`);
  });
});
