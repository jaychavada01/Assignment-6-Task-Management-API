const admin = require("../config/firebase");

module.exports = {
  sendDueDateNotification: async (deviceToken, taskTitle, dueDate) => {
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
  },

  sendUserCreationNotification: async (deviceToken, fullName) => {
    try {
      const message = {
        notification: {
          title: "User created!",
          body: `User "${fullName}" created successfully.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent user creation notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending user creation notification:", error);
    }
  },

  sendDeletionNotification: async (deviceToken, fullName) => {
    try {
      const message = {
        notification: {
          title: "User Deleted!",
          body: `User "${fullName}" has been successfully deleted.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent user delete notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending user delete notification:", error);
    }
  },

  sendUpdationNotification: async (deviceToken, fullName) => {
    try {
      const message = {
        notification: {
          title: "User Updated!",
          body: `User "${fullName}" has been successfully updated.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent user update notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending user update notification:", error);
    }
  },
  
  sendTaskAssigned: async (deviceToken, taskTitle, userId) => {
    try {
      const message = {
        notification: {
          title: "Task Creation!",
          body: `Your task "${taskTitle}" has been assigned to ${userId}.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent task assign notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending task assign notification:", error);
    }
  },

  sendTaskUpdateNotification: async (deviceToken, taskTitle) => {
    try {
      const message = {
        notification: {
          title: "Task Updation!",
          body: `Your task "${taskTitle}" has been updated!`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent task updated notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending task updated notification:", error);
    }
  },

  sendTaskDeletionNotification: async (deviceToken, title) => {
    try {
      const message = {
        notification: {
          title: "Task Deleted!",
          body: `Task "${title}" has been successfully deleted.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent task delete notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending task delete notification:", error);
    }
  },

  sendCommentAddNotification: async (deviceToken, content) => {
    try {
      const message = {
        notification: {
          title: "Comment Added to task!",
          body: `Your ${content} added to task successfully`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent comment added notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending comment added notification:", error);
    }
  },

  sendCommentUpdateNotification: async (deviceToken, content) => {
    try {
      const message = {
        notification: {
          title: "Comment updated to task!",
          body: `Your comment has been updated ${content}.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent comment updated notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending comment updated notification:", error);
    }
  },

  sendCommentDeleteNotification: async (deviceToken, content) => {
    try {
      const message = {
        notification: {
          title: "Comment deleted!",
          body: `Your comment ${content} has been deleted.`,
        },
        token: deviceToken,
      };

      const response = await admin.messaging().send(message);
      console.log("Successfully sent comment deleted notification:", response);
      return response;
    } catch (error) {
      console.error("Error sending comment deleted notification:", error);
    }
  }
};
