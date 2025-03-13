const cron = require("node-cron");
const Task = require("../models/task");
const User = require("../models/user");
const moment = require("moment");
const { sendDueDateNotification } = require("../utills/notification");

// Cron Job - Runs every 24 hours
cron.schedule("0 0 * * *", async () => {
  console.log("Running due date notification cron job...");

  try {
    // Fetch all tasks due today
    const today = moment().format("YYYY-MM-DD");

    const tasks = await Task.findAll({
      where: { dueDate: today, isDeleted: false },
      include: [{ model: User, attributes: ["fcmtoken"] }],
    });

    for (const task of tasks) {
      if (task.User && task.User.fcmtoken) {
        await sendDueDateNotification(
          task.User.fcmtoken,
          task.title,
          task.dueDate
        );
      }
    }

    console.log("Due date notifications sent successfully.");
  } catch (error) {
    console.error("Error running cron job:", error);
  }
});
