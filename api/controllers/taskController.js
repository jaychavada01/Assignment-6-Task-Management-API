const { STATUS_CODES } = require("../config/constant");
const Task = require("../models/task");

exports.createTask = async (req, res) => {
  try {
    const { title, description, dueDate, priority, status, category } =
      req.body;

    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized: User not found" });
    }

    const userId = req.user.id;

    // Validate required fields
    if (!title || !dueDate || !priority || !status || !category) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "All fields are required!" });
    }

    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      status,
      category,
      userId,
    });

    return res
      .status(STATUS_CODES.CREATED)
      .json({ message: "Task created successfully", task });
  } catch (error) {
    console.error("Create Task Error:", error); // Logs error to console
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in create task!", error: error.message });
  }
};

//? Get All Tasks for Logged-in User with filter and sorting
exports.getAllTasks = async (req, res) => {
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

    // Sorting
    const orderCondition = [[sortBy, order === "desc" ? "DESC" : "ASC"]];

    const tasks = await Task.findAll({
      where: whereCondition,
      order: orderCondition,
    });

    res.status(200).json({ tasks });
  } catch (error) {
    res.status(500).json({ message: "Error fetching tasks!" });
  }
};

//? Get Single Task by id
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const task = await Task.findOne({ where: { id, userId } });
    if (!task)
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: "Task not found" });

    res.status(STATUS_CODES.SUCCESS).json({ task });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in getting task by id!" });
  }
};

//? Update Task by id
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, dueDate, priority, status, category } =
      req.body;

    const task = await Task.findOne({ where: { id, userId } });
    if (!task) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ success: false, message: "Task not found" });
    }

    // Validate status if provided
    if (status && !["pending", "completed"].includes(status)) {
      return res
        .status(STATUS_CODES.BAD_REQUEST)
        .json({ message: "Invalid status value!" });
    }

    await task.update({
      title: title || task.title,
      description: description || task.description,
      dueDate: dueDate || task.dueDate,
      priority: priority || task.priority,
      status: status || task.status,
      category: category || task.category,
    });

    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, message: "Task updated successfully", task });
  } catch (error) {
    res.status(STATUS_CODES.SERVER_ERROR).json({ message: "Error updating task!" });
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

    await task.destroy();
    res
      .status(STATUS_CODES.SUCCESS)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ message: "Error in getting task deleted!" });
  }
};
