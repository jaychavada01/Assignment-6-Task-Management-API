const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");
const User = require("../models/user");
const { expect } = chai;

chai.use(chaiHttp);

describe("========== User Controller API Tests ==========", () => {
  let userToken;
  let forgetPasswordToken;
  let testUser = {
    fullName: "Test User",
    email: "testuser@example.com",
    password: "Password@123"
  };

  // Clean up any existing test users
  before(async () => {
    await User.destroy({ where: { email: testUser.email }, force: true });
  });

  after(async () => {
    // Final cleanup
    await User.destroy({ where: { email: testUser.email }, force: true });
  });

  /*
   * USER REGISTER
   */
  describe("User Registration", () => {
    it("should register a new user", async () => {
      const res = await chai
        .request(app)
        .post("/user/signup")
        .send(testUser);
      
      expect(res).to.have.status(201);
      expect(res.body).to.have.property("message");
      expect(res.body).to.have.property("accessToken");
      expect(res.body.accessToken).to.be.a("string");
      
      userToken = res.body.accessToken;
      
      // Verify user was created in database
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user).to.not.be.null;
      expect(user.fullName).to.equal(testUser.fullName);
    });

    it("should reject registration with existing email", async () => {
      const res = await chai
        .request(app)
        .post("/user/signup")
        .send(testUser);
      
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message");
    });

    it("should reject registration with invalid data", async () => {
      const res = await chai
        .request(app)
        .post("/user/signup")
        .send({
          fullName: "Test",
          email: "not-an-email",
          password: "short"
        });
      
      expect(res).to.have.status(400);
      expect(res.body).to.have.property("message");
    });
  });

  /*
   * USER LOGIN
   */
  describe("User Authentication", () => {
    it("should log in an existing user", async () => {
      const res = await chai
        .request(app)
        .post("/user/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      expect(res.body).to.have.property("accessToken");
      
      // Update token for subsequent tests
      userToken = res.body.accessToken;
    });

    it("should reject login with incorrect password", async () => {
      const res = await chai
        .request(app)
        .post("/user/login")
        .send({
          email: testUser.email,
          password: "WrongPassword@123"
        });
      
      expect(res).to.have.status(401);
      expect(res.body).to.have.property("message");
    });

    it("should reject login with non-existent email", async () => {
      const res = await chai
        .request(app)
        .post("/user/login")
        .send({
          email: "nonexistent@example.com",
          password: testUser.password
        });
      
      expect(res).to.have.status(404);
      expect(res.body).to.have.property("message");
    });
  });

  /*
   * USER PROFILE UPDATION
   */
  describe("User Profile Management", () => {
    it("should update user information", async () => {
      const updatedName = "Updated Test User";
      
      const res = await chai
        .request(app)
        .put("/user/update")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ 
          fullName: updatedName,
          email: testUser.email
        });
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      
      // Verify user was updated in database
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user.fullName).to.equal(updatedName);
    });

    it("should handle case where no changes are made", async () => {
      // Get the current user data
      const user = await User.findOne({ where: { email: testUser.email } });
      
      const res = await chai
        .request(app)
        .put("/user/update")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ 
          fullName: user.fullName,
          email: user.email
        });
      
      expect(res).to.have.status(200);
      // Updated to match the actual message returned by your app
      expect(res.body.message).to.equal("Nothing changed!");
    });

    it("should reject update with invalid authentication", async () => {
      const res = await chai
        .request(app)
        .put("/user/update")
        .set("Authorization", "Bearer invalid-token")
        .send({ fullName: "Should Not Update" });
      
      expect(res).to.have.status(401);
    });
  });

  /*
   * USER PASSWORD RESET
   */
  describe("Password Reset Flow", function () {
    this.timeout(10000); // 10 seconds timeout
    it("should request password reset", async () => {
        const res = await chai
          .request(app)
          .post("/user/forgot-password")
          .send({ email: testUser.email });
        
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("message");
        
        // Give some time for the database to update and email to be sent
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the reset token from the database
        const user = await User.findOne({ where: { email: testUser.email } });
        expect(user.forgetPasswordToken).to.not.be.null;
        expect(user.forgetPasswordTokenExpiry).to.not.be.null;
        
        forgetPasswordToken = user.forgetPasswordToken;
      });

    it("should reject password reset request for non-existent user", async () => {
      const res = await chai
        .request(app)
        .post("/user/forgot-password")
        .send({ email: "nonexistent@example.com" });
      
      expect(res).to.have.status(404);
    });

    it("should reset password with valid token", async () => {
      // Ensure we have a valid token
      if (!forgetPasswordToken) {
        const user = await User.findOne({ where: { email: testUser.email } });
        forgetPasswordToken = user.forgetPasswordToken;
      }

      const newPassword = "NewPassword@123";
      
      const res = await chai
        .request(app)
        .post("/user/reset-password")
        .send({
          email: testUser.email,
          token: forgetPasswordToken,
          newPassword: newPassword
        });
      
      if (res.status !== 200) {
        console.log("Reset password response:", res.body);
      }
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      
      // Verify token was cleared
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user.forgetPasswordToken).to.be.null;
      
      // Update test user password for future tests
      testUser.password = newPassword;
    });

    it("should reject password reset with invalid token", async () => {
      const res = await chai
        .request(app)
        .post("/user/reset-password")
        .send({
          email: testUser.email,
          token: "invalid-token",
          newPassword: "ShouldNotChange@123"
        });
      
      expect(res).to.have.status(400);
    });
  });

  /*
   * USER PASSWORD CHANGE
   */
  describe("Password Change", () => {
    // ? need to login again with new password
    before(async () => {
      const loginRes = await chai
        .request(app)
        .post("/user/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      userToken = loginRes.body.accessToken;
    });

    it("should change password with valid credentials", async () => {
      const finalPassword = "FinalPassword@123";
      
      const res = await chai
        .request(app)
        .post("/user/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ 
          oldPassword: testUser.password,
          newPassword: finalPassword
        });
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      
      // Update test user password
      testUser.password = finalPassword;
      
      // We need a new token since the old one was blacklisted
      const loginRes = await chai
        .request(app)
        .post("/user/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      userToken = loginRes.body.accessToken;
    });

    it("should reject password change with incorrect old password", async () => {
      const res = await chai
        .request(app)
        .post("/user/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ 
          oldPassword: "WrongOldPassword@123",
          newPassword: "ShouldNotChange@123"
        });
      
      expect(res).to.have.status(401);
    });

    it("should reject password change when new password is same as old", async () => {
      const res = await chai
        .request(app)
        .post("/user/change-password")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ 
          oldPassword: testUser.password,
          newPassword: testUser.password
        });
      
      expect(res).to.have.status(403);
    });
  });

  /*
   * USER LOGOUT
   */

  describe("Logout and Account Deletion", () => {
    it("should log out user and blacklist token", async () => {
      const res = await chai
        .request(app)
        .post("/user/logout")
        .set("Authorization", `Bearer ${userToken}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      
      // Verify the token is blacklisted
      const user = await User.findOne({ where: { email: testUser.email } });
      expect(user.blacklistedTokens).to.include(userToken);
      
      // Attempt to use blacklisted token
      const profileRes = await chai
        .request(app)
        .put("/user/update")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ fullName: "Should Not Update" });
      
      expect(profileRes).to.have.status(401);
      
      // Login again for the delete test
      const loginRes = await chai
        .request(app)
        .post("/user/login")
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      userToken = loginRes.body.accessToken;
    });

    it("should delete the user", async () => {
      const res = await chai
        .request(app)
        .delete("/user/delete")
        .set("Authorization", `Bearer ${userToken}`);
      
      expect(res).to.have.status(200);
      expect(res.body).to.have.property("message");
      
      // Verify user is soft deleted
      const user = await User.findOne({ 
        where: { email: testUser.email },
        paranoid: false  // Include soft-deleted records
      });
      
      expect(user.isDeleted).to.be.true;
      expect(user.deletedAt).to.not.be.null;
    });

    it("should reject requests after user deletion", async () => {
      const res = await chai
        .request(app)
        .put("/user/update")
        .set("Authorization", `Bearer ${userToken}`)
        .send({ fullName: "Should Not Update" });
      
      expect(res).to.have.status(401);
    });
  });
});