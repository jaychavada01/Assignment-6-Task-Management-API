const express = require("express");
const { authenticate } = require("../middleware/auth");
const { addComment, updateComment, deleteComment, getTaskComments } = require("../controllers/commentController");

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
 *    Comment:
 *      type: object
 *      properties:
 *        content:
 *          type: string
 *          description: Comment content
 *      required:
 *        - content
 */

/**
 * @swagger
 * /comment/add:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Comments in Task Management]
 *     security:
 *       - bearerAuth: []
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
router.post("/add", authenticate, addComment);

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

/**
 * @swagger
 * /comment/update/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments in Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Comment'
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.put("/update/:id", authenticate, updateComment);

/**
 * @swagger
 * /comment/delete/{id}:
 *   delete:
 *     summary: Delete a comment (soft delete)
 *     tags: [Comments in Task Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Comment not found
 */
router.delete("/delete/:id", authenticate, deleteComment);

module.exports = router;