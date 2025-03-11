const admin = require("../config/firebase");

const sendDueDateNotification = async (deviceToken, taskTitle, dueDate) => {
  try {
    const message = {
      notification: {
        title: "Task Due Reminder",
        body: `Your task "${taskTitle}" is due on ${dueDate}. Please complete it soon.`,
      },
      token: deviceToken,
    };

    const response = await admin.messaging().send(message);
    console.log("Successfully sent reminder:", response);
    return response;
  } catch (error) {
    console.error("Error sending due date reminder:", error);
  }
};

module.exports = { sendDueDateNotification };