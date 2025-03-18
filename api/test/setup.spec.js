process.env.NODE_ENV = "test"; // Set environment to test

const chai = require("chai");
const chaiHttp = require("chai-http");
const app = require("../app");

chai.use(chaiHttp);

global.chai = chai; //? chai available globally
global.expect = chai.expect;
global.app = app; //? app available for all tests

before((done) => {
  console.log("======== Running Global Test Setup... ========");
  done();
});
