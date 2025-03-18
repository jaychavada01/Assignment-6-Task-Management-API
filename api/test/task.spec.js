const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const Task = require("../models/task");
const User = require("../models/user");
const { expect } = chai;

chai.use(chaiHttp);

describe("========== Task Controller API Tests ==========", () => {
  let userToken;
  let userId;
  let taskId;

  const testUser = {
    fullName: "Task Tester",
    email: "tasktester@example.com",
    password: "Password@123",
  };

  before(async () => {
    await User.destroy({ where: { email: testUser.email }, force: true });

    // Register and log in a test user
    const signupRes = await chai
      .request(app)
      .post("/user/signup")
      .send(testUser);
    userToken = signupRes.body.accessToken;
    userId = signupRes.body.userId;
  });

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
      expect(res.body).to.have.property("message");
      expect(res.body).to.have.property("task");
      taskId = res.body.task.id;
    });
  });
});
