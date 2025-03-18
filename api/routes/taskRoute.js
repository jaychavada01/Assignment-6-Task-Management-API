const express = require("express");
const {
  createTask,
  updateTask,
  deleteTask,
  getFilteredTasks,
  getTaskById,
  updateTaskStatus,
  assignTask,
  reassignTask,
  getAssignedTasks,
} = require("../controllers/taskController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Task Management
 *   description: Task management endpoints with comments
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         dueDate:
 *           type: string
 *           format: date
 *           description: Due date for the task
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Task priority level
 *         category:
 *           type: string
 *           description: Task category
 *         parentTaskId:
 *           type: integer
 *           description: ID of parent task (for subtasks)
 *       required:
 *         - title
 */

/**
 * @swagger
 * /tasks/create:
 *   post:
 *     summary: Create a new task
 *     tags: [Task Management]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       201:
 *         description: Task created successfully
 */
router.post("/create", authenticate, createTask);

/**
 * @swagger
 * /tasks/get:
 *   get:
 *     summary: Get assigned tasks
 *     tags: [Task Management]
 *     responses:
 *       200:
 *         description: List of assigned tasks
 */
router.get("/get", authenticate, getAssignedTasks);

/**
 * @swagger
 * /tasks/getallTask:
 *   get:
 *     summary: Get all tasks
 *     tags: [Task Management]
 *     responses:
 *       200:
 *         description: List of all tasks
 */
router.get("/getallTask", authenticate, getAssignedTasks);

/**
 * @swagger
 * /tasks/filter:
 *   get:
 *     summary: Filter tasks based on criteria
 *     tags: [Task Management]
 *     responses:
 *       200:
 *         description: List of filtered tasks
 */
router.get("/filter", authenticate, getFilteredTasks);

/**
 * @swagger
 * /tasks/title/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Task Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 */
router.get("/title/:id", authenticate, getTaskById);

/**
 * @swagger
 * /tasks/update/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Task Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task updated successfully
 */
router.put("/update/:id", authenticate, updateTask);

/**
 * @swagger
 * /tasks/updateStatus/{id}:
 *   put:
 *     summary: Update task status
 *     tags: [Task Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task status updated successfully
 */
router.put("/updateStatus/:id", authenticate, updateTaskStatus);

/**
 * @swagger
 * /tasks/delete/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Task Management]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 */
router.delete("/delete/:id", authenticate, deleteTask);

/**
 * @swagger
 * /tasks/assign-task:
 *   post:
 *     summary: Assign a task to a user
 *     tags: [Task Management]
 *     responses:
 *       200:
 *         description: Task assigned successfully
 */
router.post("/assign-task", authenticate, assignTask);

/**
 * @swagger
 * /tasks/reassign-task:
 *   put:
 *     summary: Reassign a task to another user
 *     tags: [Task Management]
 *     responses:
 *       200:
 *         description: Task reassigned successfully
 */
router.put("/reassign-task", authenticate, reassignTask);

module.exports = router;