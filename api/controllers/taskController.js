const { STATUS_CODES, VALIDATION_RULES } = require("../config/constant");
const Task = require("../models/task");
const User = require("../models/user");
const Validator = require("validatorjs");
const Comment = require("../models/comment");
const {
  sendTaskAssigned,
  sendTaskDeletionNotification,
  sendTaskUpdateNotification,
} = require("../utills/notification");

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

    const {
      title,
      description,
      dueDate,
      priority,
      category,
      parentTaskId,
      createdBy,
    } = req.body;

    // Validate parent task existence if provided
    if (parentTaskId) {
      const parentTask = await Task.findByPk(parentTaskId);
      if (!parentTask) {
        return res
          .status(STATUS_CODES.NOT_FOUND)
          .json({ message: req.t("task.no_parent") });
      }
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      category,
      parentTaskId: parentTaskId || null,
      createdBy: createdBy || null,
    });

    return res
      .status(STATUS_CODES.CREATED)
      .json({ message: req.t("task.created"), task });
  } catch (error) {
    console.error("Create Task Error:", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

// ? assigning task to user
exports.assignTask = async (req, res) => {
  try {
    const { taskId, userId } = req.body;

    if (!taskId || !userId) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: req.t("common.missing_fields") });
    }

    const task = await Task.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("task.no_task") });

    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ message: req.t("auth.no_user") });

    task.userId = userId;
    await task.save();

    if (user?.fcmToken) {
      await sendTaskAssigned(user.fcmToken, task.title, userId);
    }

    return res
      .status(STATUS_CODES.SUCCESS)
      .json({ message: req.t("task.task_assign") });
  } catch (error) {
    console.error("Assign Task Error:", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};

// ? reassign task to new user
exports.reassignTask = async (req, res) => {
  try {
    const { taskId, newUserId } = req.body;

    if (!taskId || !newUserId) {
      return res
        .status(400)
        .json({ message: "Task ID and New User ID are required" });
    }

    const task = await Task.findOne({
      where: { id: taskId, isDeleted: false },
    });
    if (!task) {
      return res.status(404).json({ message: req.t("task.no_task") });
    }

    const user = await User.findOne({
      where: { id: newUserId, isDeleted: false },
    });
    if (!user) {
      return res.status(404).json({ message: req.t("auth.no_user") });
    }

    task.userId = newUserId;
    task.updatedBy = req.user.id;
    await task.save();

    if (user?.fcmToken) {
      await sendTaskAssigned(user.fcmToken, task.title, newUserId);
    }

    return res.status(200).json({ message: req.t("task.task_reassign") });
  } catch (error) {
    return res.status(500).json({ message: req.t("common.server_error") });
  }
};

//? Get all tasks-subtask-comments assigned to user
exports.getAssignedTasks = async (req, res) => {
  try {
    const userId = req.user.id;

    const tasks = await Task.findAll({
      where: { userId, isDeleted: false },
      include: [
        {
          model: Task,
          as: "subtasks",
          where: { isDeleted: false },
          required: false,
        },
        {
          model: Comment,
          where: { isDeleted: false },
          include: [{ model: User, attributes: ["id", "fullName"] }],
          required: false,
        },
      ],
      order: [["dueDate", "ASC"]],
    });

    return res.status(STATUS_CODES.SUCCESS).json({
      message: req.t("task.all_task"),
      tasks,
    });
  } catch (error) {
    console.error("Error fetching assigned tasks:", error);
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};


//? Get filtered tasks assigned to user
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
      include: [
        {
          model: Task,
          as: "subtasks",
          where: { isDeleted: false },
          required: false, // Include even if there are no subtasks
        },
        {
          model: Comment,
          where: { isDeleted: false },
          include: [{ model: User, attributes: ["id", "fullName"] }],
          required: false, // Include even if there are no comments
        },
      ],
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

//? Get Single Task by ID for user
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params; // Get id from params
    const userId = req.user?.id;

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

//? Update Task by id for user
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(STATUS_CODES.UNAUTHORIZED).json({
        success: false,
        message: req.t("auth.unauth_user_not"),
        task: null,
      });
    }

    const { title, description, dueDate, priority, category, parentTaskId } =
      req.body;

    const task = await Task.findOne({
      where: { id, userId, isDeleted: false },
    });
    if (!task) {
      return res.status(STATUS_CODES.NOT_FOUND).json({
        message: req.t("task.no_task"),
      });
    }

    // Prevent a task from being its own parent
    if (parentTaskId && parentTaskId === id) {
      return res.status(STATUS_CODES.BAD_REQUEST).json({
        message: req.t("task.not_own_parent"),
        task: null,
      });
    }

    // Check if any changes were made
    const isSameData =
      title === task.title &&
      description === task.description &&
      dueDate === task.dueDate &&
      priority === task.priority &&
      category === task.category &&
      parentTaskId === task.parentTaskId;

    if (isSameData) {
      return res.status(STATUS_CODES.NOT_MODIFIED).json({
        success: false,
        message: req.t("task.no_changes"),
      });
    }

    await Task.update(
      { title, description, dueDate, priority, category, parentTaskId },
      { where: { id, userId } }
    );

    // Retrieve user for push notification
    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });
    if (user.fcmToken) {
      await sendTaskUpdateNotification(user.fcmToken, task.title);
    }

    res.status(STATUS_CODES.SUCCESS).json({
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

    const task = await Task.findOne({
      where: { id, userId, isDeleted: false },
    });

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
      "completed",
    ];
    if (!validStatuses.includes(status)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: req.t("task.invalid_status") });
    }

    // Check if status is unchanged
    if (task.status === status) {
      return res.status(STATUS_CODES.NOT_MODIFIED).json({
        success: false,
        message: req.t("task.no_changes"),
      });
    }

    // Retrieve user for push notification
    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });
    if (user.fcmToken) {
      await sendTaskUpdateNotification(user.fcmToken, task.title);
    }

    await Task.update({ status }, { where: { id, userId } });

    res.status(STATUS_CODES.SUCCESS).json({
      message: req.t("task.task_updated"),
    });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({
      message: req.t("common.server_error"),
    });
  }
};

//? Delete Task by id
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findOne({
      where: { id, userId, isDeleted: false },
    });

    if (!task) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: req.t("task.no_task") });
    }

    // Soft delete the task using Sequelize's destroy() method
    await task.update({
      deletedBy: userId,
      isDeleted: true,
    });

    await task.destroy();

    // Retrieve user for push notification
    const user = await User.findOne({
      where: { id: userId, isDeleted: false },
    });
    if (user.fcmToken) {
      await sendTaskDeletionNotification(user.fcmToken, task.title);
    }

    res.status(STATUS_CODES.SUCCESS).json({ message: req.t("task.deleted") });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: req.t("common.server_error") });
  }
};
