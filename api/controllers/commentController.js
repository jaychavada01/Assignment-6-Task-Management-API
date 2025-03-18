const { STATUS_CODES } = require("../config/constant");
const Comment = require("../models/comment");
const Task = require("../models/task");
const User = require("../models/user");
const { sendCommentAddNotification, sendCommentUpdateNotification, sendCommentDeleteNotification } = require("../utills/notification");

//? Add Comment (depends on taskId)
exports.addComment = async (req, res) => {
  try {
    const { taskId, content } = req.body;
    const userId = req.user.id;

    // Check if the task exists
    const task = await Task.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: req.t("task.no_task") });
    }

    const comment = await Comment.create({
      taskId,
      content,
      userId: req.user.id,
      createdBy: userId, // Track user who created the comment
    });

    // Retrieve user for push notification
    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });
    if (user.fcmToken) {
      await sendCommentAddNotification(user.fcmToken, comment.content);
    }

    return res
      .status(STATUS_CODES.CREATED)
      .json({ success: true, message: req.t("comment.added") });
  } catch (error) {
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ success: false, message: req.t("common.server_error") });
  }
};

//? Update Comment (depends on taskId)
exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskId, content } = req.body;
    const updatedBy = req.user?.id ?? null;

    // Find the comment
    const comment = await Comment.findOne({
      where: { id, taskId, isDeleted: false },
    });

    if (!comment) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: req.t("comment.no_comment"),
      });
    }

    // Check if content is unchanged
    if (comment.content === content) {
      return res.status(STATUS_CODES.NOT_MODIFIED).json({
        success: false,
        message: req.t("comment.not_modified"), // Add this message in translations
      });
    }

    // Update the comment
    await comment.update({ content, updatedBy });

    // Retrieve user for push notification
    const user = await User.findOne({
      where: { id: updatedBy, isDeleted: false },
    });
    if (user.fcmToken) {
      await sendCommentUpdateNotification(user.fcmToken, comment.content);
    }

    return res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: req.t("comment.updated"),
    });
  } catch (error) {
    return res.status(STATUS_CODES.SERVER_ERROR).json({
      success: false,
      message: req.t("common.server_error"),
    });
  }
};

//? Delete Comment (Soft Delete, depends on taskId)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { taskId } = req.body; // Ensure the comment is linked to the task
    const deletedBy = req.user?.id ?? null;

    // Find the comment (ensuring it's linked to the task and not already deleted)
    const comment = await Comment.findOne({
      where: { id, taskId, isDeleted: false },
    });

    if (!comment) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: req.t("comment.no_comment") });
    }

    // Soft delete the comment
    await comment.update({ deletedBy, isDeleted: true });
    await comment.destroy();

    // Retrieve user for push notification
    const user = await User.findOne({
      where: { id: updatedBy, isDeleted: false },
    });
    if (user.fcmToken) {
      await sendCommentDeleteNotification(user.fcmToken, comment.content);
    }

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, message: req.t("comment.deleted") });
  } catch (error) {
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ success: false, message: req.t("common.server_error") });
  }
};

exports.getTaskComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { sortBy = "newer" } = req.query; // Default sorting by "newer"

    // Check if task exists and is not deleted
    const task = await Task.findOne({
      where: { id: taskId, isDeleted: false },
    });

    if (!task) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: req.t("task.no_task"),
      });
    }

    const orderCondition = sortBy.toLowerCase() === "older" ? "ASC" : "DESC";

    const comments = await Comment.findAll({
      where: { taskId },
      include: [
        {
          model: User,
          attributes: ["id", "fullName"],
          required: false,
        },
      ],
      order: [["createdAt", orderCondition]], // Sort by createdAt
    });

    res.status(STATUS_CODES.SUCCESS).json({
      message: req.t("comment.all_comments"),
      comments,
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: req.t("common.server_error"),
    });
  }
};
