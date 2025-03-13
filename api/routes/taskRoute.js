const express = require("express");
const { createTask, getAllTasksAssignedToUser, updateTask, deleteTask, getFilteredTasks, getTaskById, updateTaskStatus, addComment, getTaskComments } = require("../controllers/taskController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenticate, createTask);
router.get("/get", authenticate, getAllTasksAssignedToUser);
router.get("/filter", authenticate, getFilteredTasks);
router.get("/title/:id", authenticate, getTaskById);

router.put("/update/:id", authenticate, updateTask);
router.put("/updateStatus/:id", authenticate, updateTaskStatus);
router.delete("/delete/:id", authenticate, deleteTask);

// Add Comment
router.post("/comment/:taskId", authenticate, addComment);

// Get Comments (Older/Newer)
router.get("/comments/:taskId", authenticate, getTaskComments);

module.exports = router;