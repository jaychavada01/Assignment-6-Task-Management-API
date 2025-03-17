const { STATUS_CODES } = require("../config/constant");
const Comment = require("../models/comment");
const Task = require("../models/task");

exports.addComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // ? check if task exists and is not deleted
    const task = await Task.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: req.t("task.no_task"),
      });
    }

    const comment = await Comment.create({
      content,
      userId,
      taskId,
    });

    res.status(STATUS_CODES.CREATED).json({
      message: req.t("comment.added"),
      comment,
    });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
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
      include: [{ model: User, attributes: ["id", "fullName"] }],
      order: [["createdAt", orderCondition]], // Sort by createdAt
    });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: req.t("comment.all_comments"),
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: req.t("common.server_error"),
      error: error.message,
    });
  }
};
