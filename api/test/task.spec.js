const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const Task = require("../models/task");
const User = require("../models/user");
const { expect } = chai;

chai.use(chaiHttp);

describe("========== Task Controller API Tests ==========", () => {
  let userToken;
  let secondUserToken;
  let userId;
  let secondUserId;
  let taskId;

  const testUser = {
    fullName: "Task Tester",
    email: "tasktester@example.com",
    password: "Password@123",
  };

  const secondTestUser = {
    fullName: "Second Tester",
    email: "secondtester@example.com",
    password: "Password@123",
  };

  before(async () => {
    // Cleanup before tests
    await User.destroy({ where: {}, force: true });
    await Task.destroy({ where: {}, force: true });

    // Register & Login first user
    const signupRes = await chai
      .request(app)
      .post("/user/signup")
      .send(testUser);
    userToken = signupRes.body.accessToken;
    userId = signupRes.body.userId || signupRes.body.user?.id;

    // Register & Login second user
    const secondSignupRes = await chai
      .request(app)
      .post("/user/signup")
      .send(secondTestUser);
    secondUserToken = secondSignupRes.body.accessToken;
    secondUserId = secondSignupRes.body.userId || secondSignupRes.body.user?.id;
  });

  /*
   * CREATE TASK
   */
  describe("Task Creation", () => {
    it("should reject task creation with missing fields", async () => {
      const res = await chai
        .request(app)
        .post("/task/create")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ title: "Incomplete Task" });

      expect(res).to.have.status(400);
    });

    it("should create a new task", async () => {
      const res = await chai
        .request(app)
        .post("/task/create")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          title: "Test Task",
          description: "This is a test task",
          dueDate: "2025-03-25",
          priority: "High",
          category: "Work",
        });

      expect(res).to.have.status(201);
      taskId = res.body.task.id;

      const task = await Task.findByPk(taskId);
      expect(task).to.not.be.null;
      expect(task.userId).to.be.null; // Task initially unassigned
    });
  });

  /*
   * ASSIGN - REASSIGN TASK
   */
  describe("Task Assignment", () => {
    it("should assign a task to a user", async () => {
      const res = await chai
        .request(app)
        .post("/task/assign-task")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ taskId, userId });

      expect(res).to.have.status(200);

      const updatedTask = await Task.findByPk(taskId);
      expect(updatedTask.userId).to.equal(userId);
    });

    it("should reassign the task to second user", async () => {
      const res = await chai
        .request(app)
        .put("/task/reassign-task")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ taskId, newUserId: secondUserId });

      expect(res).to.have.status(200);

      const reassignedTask = await Task.findByPk(taskId);
      expect(reassignedTask.userId).to.equal(secondUserId);
    });
  });

  /*
   * ALL ASSIGNED TASK
   */
  describe("Get Assigned Tasks", () => {
    it("should return assigned tasks for second user", async () => {
      const res = await chai
        .request(app)
        .get("/task/getallTask")
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(200);
      expect(res.body.tasks).to.be.an("array").that.is.not.empty;
      expect(res.body.tasks[0].userId).to.equal(secondUserId);
    });

    it("should return an empty array for unassigned user", async () => {
      const newUserRes = await chai.request(app).post("/user/signup").send({
        fullName: "No Task User",
        email: "notask@example.com",
        password: "Password@123",
      });

      const newUserToken = newUserRes.body.accessToken;

      const res = await chai
        .request(app)
        .get("/task/getallTask")
        .set("Authorization", `Bearer ${newUserToken}`);

      expect(res).to.have.status(200);
      expect(res.body.tasks).to.be.an("array").that.is.empty;
    });
  });

  /*
   * FILTER
   */
  describe("Get Filtered Tasks", () => {
    it("should return tasks assigned to second user", async () => {
      const res = await chai
        .request(app)
        .get("/task/filter")
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(200);
      expect(res.body.tasks).to.be.an("array").that.is.not.empty;
    });

    it("should return filtered tasks by status", async () => {
      await Task.update({ status: "inprocess" }, { where: { id: taskId } });

      const res = await chai
        .request(app)
        .get("/task/filter?status=inprocess")
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(200);
      expect(res.body.tasks[0].status).to.equal("inprocess");
    });
  });

  /*
   * GET TASK BY ID
   */
  describe("Get Task By ID", () => {
    it("should fetch task details", async () => {
      const res = await chai
        .request(app)
        .get(`/task/title/${taskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(200);
      expect(res.body.task.id).to.equal(taskId);
    });

    it("should return 404 for invalid task ID", async () => {
      const res = await chai
        .request(app)
        .get("/task/title/550e8400-e29b-41d4-a716-446655440000")
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(404);
    });
  });

  /*
   * UPDATE TASK
   */
  describe("Update Task", () => {
    it("should update task details", async () => {
      const res = await chai
        .request(app)
        .put(`/task/update/${taskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send({ title: "Updated Task", category: "Personal" });

      expect(res).to.have.status(200);

      const updatedTask = await Task.findByPk(taskId);
      expect(updatedTask.title).to.equal("Updated Task");
      expect(updatedTask.category).to.equal("Personal");
    });
  });

  /*
   * UPDATE TASK STATUS
   */
  describe("Update Task Status", () => {
    it("should update task status", async () => {
      const res = await chai
        .request(app)
        .put(`/task/updateStatus/${taskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send({ status: "completed" });

      expect(res).to.have.status(200);

      const updatedTask = await Task.findByPk(taskId);
      expect(updatedTask.status).to.equal("completed");
    });

    it("should reject invalid status", async () => {
      const res = await chai
        .request(app)
        .put(`/task/updateStatus/${taskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`)
        .send({ status: "invalid" });

      expect(res).to.have.status(400);
    });
  });

  /*
   * DELETE TASK
   */
  describe("Delete Task", () => {
    it("should delete a task assigned to secondTestUser", async () => {
      const res = await chai
        .request(app)
        .delete(`/task/delete/${taskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");

      const deletedTask = await Task.findByPk(taskId);
      expect(deletedTask).to.be.null; // Ensure the task is deleted
    });

    it("should return 404 for already deleted task", async () => {
      const res = await chai
        .request(app)
        .delete(`/task/delete/${taskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(404);
    });

    it("should return 404 if task does not exist", async () => {
      const fakeTaskId = "550e8400-e29b-41d4-a716-446655440000";
      const res = await chai
        .request(app)
        .delete(`/task/delete/${fakeTaskId}`)
        .set("Authorization", `Bearer ${secondUserToken}`);

      expect(res).to.have.status(404);
    });

    it("should prevent unauthorized users from deleting a task", async () => {
      const res = await chai
        .request(app)
        .delete(`/task/delete/${taskId}`)
        .set("Authorization", `Bearer ${userToken}`); // First user (not assigned)

      expect(res).to.have.status(404); // Task was reassigned to second user
    });

    it("should reject unauthorized request", async () => {
      const res = await chai.request(app).delete(`/task/delete/${taskId}`); // No auth token

      expect(res).to.have.status(401);
    });
  });
});
