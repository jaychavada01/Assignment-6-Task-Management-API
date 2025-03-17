const { STATUS_CODES, VALIDATION_RULES } = require("../config/constant");
const Task = require("../models/task");
const User = require("../models/user");
const Validator = require("validatorjs");
const { sendTaskCreationNotification } = require("../utills/notification");
const Comment = require("../models/comment");

const validateRequest = (data, rules, res) => {
  const validation = new Validator(data, rules);
  if (validation.fails()) {
    return res
      .status(STATUS_CODES.BAD_REQUEST)
      .json({ message: validation.errors.all() });
  }
  return true;
};

exports.createTask = async (req, res) => {
  try {
    if (!validateRequest(req.body, VALIDATION_RULES.CREATE_TASK, res)) return;
    const { title, description, dueDate, priority, category, parentTaskId } =
      req.body;

    if (!req.user) {
      return res
        .status(STATUS_CODES.UNAUTHORIZED)
        .json({ message: req.t("auth.unauth_user_not") });
    }

    const userId = req.user.id;

    // Validate parent task existence if provided
    if (parentTaskId) {
      const parentTask = await Task.findOne({
        where: { id: parentTaskId, userId },
      });
      if (!parentTask) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: req.t("task.no_parent") });
      }
    }

    //? Ensure only one user per task title
    const existingTask = await Task.findOne({ where: { title, userId } });
    if (existingTask) {
      return res.status(STATUS_CODES.CONFLICT).json({
        message: req.t("task.same_title"),
      });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      category,
      userId,
      parentTaskId: parentTaskId || null,
    });

    // Fetch user's device token
    const user = await User.findByPk(userId);
    if (user && user.fcmtoken) {
      await sendTaskCreationNotification(user.fcmtoken, title);
    }

    return res
      .status(STATUS_CODES.CREATED)
      .json({ message: req.t("task.created"), task });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error"), error: error.message });
  }
};

//? Get all tasks-subtask assigned to the logged-in user
exports.getAllTasksAssignedToUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.findAll({
      where: { userId, isDeleted: false }, // Exclude deleted tasks
      include: [
        {
          model: Task,
          as: "subtasks",
          where: { isDeleted: false }, // Exclude deleted subtasks
          required: false, // Ensures tasks without subtasks are also included
        },
        {
          model: Comment,
          include: [{ model: User, attributes: ["id", "fullName"] }],
        }, // Include comments
      ],
      order: [["dueDate", "ASC"]],
    });

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("task.all_task"), tasks });
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error"), error: error.message });
  }
};

//? Get filtered tasks assigned to the logged-in user
exports.getFilteredTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      category,
      priority,
      sortBy = "dueDate",
      order = "asc",
    } = req.query;

    // Filter conditions
    const whereCondition = { userId };
    if (status) whereCondition.status = status;
    if (category) whereCondition.category = category;
    if (priority) whereCondition.priority = priority;

    // Sorting condition
    const orderCondition = [
      [sortBy, order.toLowerCase() === "desc" ? "DESC" : "ASC"],
    ];

    const tasks = await Task.findAll({
      where: whereCondition,
      order: orderCondition,
      include: [{ model: Task, as: "subtasks" }],
    });

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("task.filter"), tasks });
  } catch (error) {
    console.error("Error fetching filtered tasks:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error"), error: error.message });
  }
};

//? Get Single Task by ID
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params; // Get id from params
    const userId = req.user.id; // Get user ID from authenticated request

    // Find task with matching title and assigned user
    const task = await Task.findOne({
      where: { id, userId, isDeleted: false },
      include: [
        { model: Task, as: "subtasks" },
        {
          model: Comment,
          include: [{ model: User, attributes: ["id", "fullName"] }],
        }, // Include comments
      ],
    });

    if (!task) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: req.t("task.no_task") });
    }

    res.status(STATUS_CODES.SUCCESS).json({ success: true, task });
  } catch (error) {
    console.error("Get Task By Title Error:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

//? Update Task by id
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id; // Ensure user exists

    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: req.t("auth.unauth_user_not"),
        task: null,
      });
    }

    const { title, description, dueDate, priority, category, parentTaskId } =
      req.body;

    const task = await Task.findOne({ where: { id, userId } });
    if (!task) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: req.t("task.not_task"),
        task: null,
      });
    }

    // Prevent a task from being its own parent
    if (parentTaskId && parentTaskId === id) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: req.t("task.not_own_parent"),
        task: null,
      });
    }

    // ? check if task is deleted
    if (task.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: req.t("task.delete_no_update"),
      });
    }

    const updatedFields = {
      title,
      description,
      dueDate,
      priority,
      category,
      parentTaskId,
    };

    await Task.update(updatedFields, { where: { id, userId } });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: req.t("task.task_updated"),
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: req.t("common.server_error"),
      error: error.message,
      task: null,
    });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { status } = req.body;

    const task = await Task.findOne({ where: { id, userId } });
    if (!task) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("task.no_task") });
    }

    const validStatuses = [
      "todo",
      "inprocess",
      "inreview",
      "testing",
      "Completed",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: req.t("task.invalid_status") });
    }

    // ? check if task is deleted
    if (task.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: req.t("task.delete_no_update_status"),
      });
    }

    await Task.update({ status }, { where: { id, userId } });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: req.t("task.task_updated"),
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: req.t("common.server_error"),
      error: error.message,
    });
  }
};

//? Delete Task by id
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findOne({ where: { id, userId } });
    if (!task)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: req.t("task.no_task") });

    // Check if the task is already deleted
    if (task.isDeleted) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: req.t("task.already_deleted") });
    }

    // Soft delete the task (set isDeleted to true)
    await task.update({ isDeleted: true });
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, message: req.t("task.deleted") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

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
