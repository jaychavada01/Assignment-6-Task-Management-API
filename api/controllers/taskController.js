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
        .json({ message: "Unauthorized: User not found" });
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
          .json({ message: "Parent task not found or not assigned to user." });
      }
    }

    //? Ensure only one user per task title
    const existingTask = await Task.findOne({ where: { title, userId } });
    if (existingTask) {
      return res.status(STATUS_CODES.CONFLICT).json({
        message: "Task with this title already exists for this user.",
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
      .json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in create task!", error: error.message });
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
      .json({ message: "All tasks retrieved successfully!", tasks });
  } catch (error) {
    console.error("Error fetching all tasks:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error fetching tasks!", error: error.message });
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
      .json({ message: "Filtered tasks retrieved successfully!", tasks });
  } catch (error) {
    console.error("Error fetching filtered tasks:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error fetching tasks!", error: error.message });
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
        .json({ success: false, message: "Task not found" });
    }

    res.status(STATUS_CODES.SUCCESS).json({ success: true, task });
  } catch (error) {
    console.error("Get Task By Title Error:", error);
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ success: false, message: "Error in getting task by id!" });
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
        message: "Unauthorized: User not found",
        task: null,
      });
    }

    const { title, description, dueDate, priority, category, parentTaskId } =
      req.body;

    const task = await Task.findOne({ where: { id, userId } });
    if (!task) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        success: false,
        message: "Task not found",
        task: null,
      });
    }

    // Prevent a task from being its own parent
    if (parentTaskId && parentTaskId === id) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: "A task cannot be its own parent.",
        task: null,
      });
    }

    // ? check if task is deleted
    if (task.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Task is deleted can't updated",
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
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: "Error updating task!",
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
        .json({ success: false, message: "Task not found" });
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
        .json({ message: "Invalid status value!" });
    }

    // ? check if task is deleted
    if (task.isDeleted) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        success: false,
        message: "Task is deleted can't updated Status",
      });
    }

    await Task.update({ status }, { where: { id, userId } });

    res.status(STATUS_CODES.SUCCESS).json({
      success: true,
      message: "Task status updated successfully",
    });
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: "Error updating task status!",
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
        .json({ success: false, message: "Task not found" });

    // Check if the task is already deleted
    if (task.isDeleted) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ success: false, message: "Task is already deleted" });
    }

    // Soft delete the task (set isDeleted to true)
    await task.update({ isDeleted: true });
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in getting task deleted!" });
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
        message: "Task not found or is deleted",
      });
    }

    const comment = await Comment.create({
      content,
      userId,
      taskId,
    });

    res.status(STATUS_CODES.CREATED).json({
      message: "Comment added successfully",
      comment,
    });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in adding comment!" });
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
        message: "Task not found or is deleted",
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
      message: "Comments retrieved successfully",
      comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: "Error fetching comments!",
      error: error.message,
    });
  }
};
