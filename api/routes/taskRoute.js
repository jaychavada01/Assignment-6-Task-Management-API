const express = require("express");
const {
  createTask,
  getAllTasksAssignedToUser,
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
 * /task/create:
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
 *       400:
 *         description: Invalid input
 */
router.post("/create", createTask);

router.get("/get", authenticate, assignTask);

/**
 * @swagger
 * /task/get:
 *   get:
 *     summary: Get all tasks assigned to the logged-in user
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all tasks
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/getallTask", authenticate, getAssignedTasks);

/**
 * @swagger
 * /task/filter:
 *   get:
 *     summary: Get filtered tasks
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, inprocess, inreview, testing, Completed]
 *         description: Filter by task status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by task category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter by priority level
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: dueDate
 *         description: Field to sort by
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: Filtered list of tasks
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get("/filter", authenticate, getFilteredTasks);

/**
 * @swagger
 * /task/title/{id}:
 *   get:
 *     summary: Get task by ID
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.get("/title/:id", authenticate, getTaskById);

/**
 * @swagger
 * /task/update/{id}:
 *   put:
 *     summary: Update a task
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Task'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Invalid input or task is deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.put("/update/:id", authenticate, updateTask);

/**
 * @swagger
 * /task/updateStatus/{id}:
 *   put:
 *     summary: Update task status
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, inprocess, inreview, testing, Completed]
 *             required:
 *               - status
 *     responses:
 *       200:
 *         description: Task status updated successfully
 *       400:
 *         description: Invalid status or task is deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.put("/updateStatus/:id", authenticate, updateTaskStatus);

/**
 * @swagger
 * /task/delete/{id}:
 *   delete:
 *     summary: Delete a task (soft delete)
 *     tags: [Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       400:
 *         description: Task already deleted
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.delete("/delete/:id", authenticate, deleteTask);

router.post("/assign-task", authenticate, assignTask);
router.put("/reassign-task", authenticate, reassignTask);

module.exports = router;
