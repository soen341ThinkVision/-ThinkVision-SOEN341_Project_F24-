const request = require("supertest");
const app = require("../app");
const { Teacher, Student } = require("../models");

jest.mock("../config/db", () => ({
  execute: jest.fn().mockResolvedValue(),
}));
jest.mock("../models");

describe("login system", () => {
  const roles = ["Teacher", "Student"];

  beforeEach(() => {
    Teacher.find.mockReset();
    Student.find.mockReset();

    Teacher.find.mockResolvedValue([{ id: 0, username: "T" }]);
    Student.find.mockResolvedValue([{ id: 0, username: "S" }]);
  });

  test("call database to verify user is registered", async () => {
    for (const role of roles) {
      await request(app)
        .post("/login")
        .send({ Option: `${role}` });
    }

    expect(Student.find).toHaveBeenCalledTimes(1);
    expect(Teacher.find).toHaveBeenCalledTimes(1);
  });

  test("do not log in if user is not found", async () => {
    Teacher.find.mockResolvedValue([]);
    Student.find.mockResolvedValue([]);

    for (const role of roles) {
      await request(app)
        .post("/login")
        .send({
          Username: "user",
          Password: "password",
          Option: `${role}`,
        })
        .expect("Location", "/login");
    }
  });

  test("do not login if any of username, password, or role are missing", async () => {
    let requestBody = [
      { Username: "", Password: "", Option: "Teacher" },
      { Username: "", Password: "", Option: "Student" },
      { Username: "", Password: "0", Option: "Teacher" },
      { Username: "", Password: "0", Option: "Student" },
      { Username: "x", Password: "", Option: "Teacher" },
      { Username: "x", Password: "", Option: "Student" },
    ];

    for (const body of requestBody) {
      Teacher.find.mockResolvedValue([]);
      Student.find.mockResolvedValue([]);
      await request(app).post("/login").send(body).expect("Location", "/login");
    }

    requestBody = [
      { Username: "", Password: "", Option: "" },
      { Username: "", Password: "0", Option: "" },
      { Username: "x", Password: "0", Option: "" },
      { Username: "x", Password: "", Option: "" },
    ];

    for (const body of requestBody) {
      await request(app).post("/login").send(body).expect("Location", "/login");
    }
  });

  test("return code 200 when valid username and password are submitted", async () => {
    for (const role of roles) {
      const response = await request(app)
        .post("/login")
        .send({
          Username: "user",
          Password: "password",
          Option: `${role}`,
        });
      expect(response.statusCode).toBe(200);
    }
  });

  test("register session to current user upon successful login", async () => {
    for (const role of roles) {
      Teacher.find.mockResolvedValue([
        { username: "*** SESSION-USER-TEST ***" },
      ]);
      Student.find.mockResolvedValue([
        { username: "*** SESSION-USER-TEST ***" },
      ]);

      const response = await request(app)
        .post("/login")
        .send({
          Username: "user",
          Password: "password",
          Option: `${role}`,
        });

      expect(response.status).toBe(200);
      expect(response.text).toContain("*** SESSION-USER-TEST ***");
    }
  });
});
