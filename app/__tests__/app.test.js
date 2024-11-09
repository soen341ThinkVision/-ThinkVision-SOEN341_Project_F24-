const request = require("supertest");
const app = require("../app");
const Teacher = require("../models/Teacher.js");
const Student = require("../models/Student.js");
const { writeFile } = require("fs").promises;

// const db = require("../config/db");
// const mysql = require("mysql2");
//const controllers = require("../controllers/controllers.js");

// jest.mock("../models/Teacher.js", () => {
//   return {
//     find: jest.fn(),
//   };
// });
// jest.mock("../models/Student.js", () => {
//   return {
//     find: jest.fn(),
//   };
// });

jest.mock("mysql2", () => {
  return {
    createPool: jest.fn(() => ({
      query: jest.fn(),
      promise: jest.fn(),
    })),
  };
});

Teacher.find = jest.fn();
Student.find = jest.fn();
Student.save = jest.fn();

describe("login system", () => {
  const roles = ["Teacher", "Student"];

  beforeEach(() => {
    Teacher.find.mockReset();
    Student.find.mockReset();

    Teacher.find.mockResolvedValue([{ id: 0, username: "T" }]);
    Student.find.mockResolvedValue([{ id: 0, username: "S" }]);
  });

  it("calls database to verify user is registered", async () => {
    for (const role of roles) {
      const response = await request(app)
        .post("/login")
        .send({
          Option: `${role}`,
        });
    }

    expect(Student.find).toHaveBeenCalledTimes(1);
    expect(Teacher.find).toHaveBeenCalledTimes(1);
  });

  it("does not log in if user is not found", async () => {
    Teacher.find.mockResolvedValue([]);
    Student.find.mockResolvedValue([]);

    for (const role of roles) {
      const response = await request(app)
        .post("/login")
        .send({
          Username: "user",
          Password: "password",
          Option: `${role}`,
        })
        .expect("Location", "/login");
    }
  });

  it("does not login if either username, password, or role are missing", async () => {
    var requestBody = [
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
      const response = await request(app)
        .post("/login")
        .send(body)
        .expect("Location", "/login");
    }

    requestBody = [
      { Username: "", Password: "", Option: "" },
      { Username: "", Password: "0", Option: "" },
      { Username: "x", Password: "0", Option: "" },
      { Username: "x", Password: "", Option: "" },
    ];

    for (const body of requestBody) {
      const response = await request(app)
        .post("/login")
        .send(body)
        .expect("Location", "/login");
    }
  });

  it("returns status code 200 when valid username and password are submitted", async () => {
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

  it("registers session to current user upon successful login", async () => {
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

describe("file upload", () => {
  beforeEach(() => {
    Student.save.mockReset();
  });

  it("returns status code 201 after processing csv file", async () => {
    await writeFile("./__tests__/test_roster.csv", "ID,Name\n");
    const response = await request(app)
      .post("/upload/0")
      .attach("file", "./__tests__/test_roster.csv");

    expect(response.statusCode).toBe(201);
  });

  it("given course roster of x students, registers x students in the database", async () => {
    await writeFile("./__tests__/test_roster.csv", "ID,Name\n");
    const numOfStudents = 50;
    for (let i = 1; i <= numOfStudents; i++) {
      await writeFile("./__tests__/test_roster.csv", `${i},student_${i}\n`, {
        flag: "a",
      });
    }

    const response = await request(app)
      .post("/upload/0")
      .attach("file", "./__tests__/test_roster.csv");

    expect(Student.save).toHaveBeenCalledTimes(numOfStudents);
    expect(response.statusCode).toBe(201);
  });
});
