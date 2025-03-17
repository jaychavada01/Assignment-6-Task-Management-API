const express = require("express");
const {
  addComment,
  getTaskComments,
} = require("../controllers/commentController");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Comments in Task Management
 *   description: Task management endpoints with comments
 */

/**
 * @swagger
 * components:
 *  schemas:
 *  Comment:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: Comment content
 *       required:
 *         - content
 */

/**
 * @swagger
 * /comment/addcomment/{taskId}:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments in Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.post("/addcomment/:taskId", authenticate, addComment);

/**
 * @swagger
 * /comment/allcomments/{taskId}:
 *   get:
 *     summary: Get comments for a task
 *     tags: [Comments in Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newer, older]
 *           default: newer
 *         description: Sort comments by creation date
 *     responses:
 *       200:
 *         description: List of comments for the task
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Task not found
 */
router.get("/allcomments/:taskId", authenticate, getTaskComments);

module.exports = router;
