const app = require("./app");
const { sequelize } = require("./config/database");

sequelize.sync({ alter: true }).then(() => {
  console.log("Database Synced!");
  app.listen(process.env.PORT, () => {
    console.log(`Server running on http://localhost:${process.env.PORT}`);
    console.log(
      `Swagger Docs available at: http://localhost:${process.env.PORT}/api-docs`
    );
  });
});
