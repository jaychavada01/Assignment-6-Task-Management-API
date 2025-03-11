const express = require("express");
const { createTask, getAllTasks, getTaskById, updateTask, deleteTask } = require("../controllers/taskController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.post("/create", authenticate, createTask);
router.get("/get", authenticate, getAllTasks);
router.get("/:id", authenticate, getTaskById);
router.put("/:id", authenticate, updateTask);
router.delete("/:id", authenticate, deleteTask);

module.exports = router;