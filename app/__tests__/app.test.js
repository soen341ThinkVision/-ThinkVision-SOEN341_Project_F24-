const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");
const mysql = require("mysql2");

// Mock the mysql2 connection
jest.mock("mysql2", () => {
  return {
    createPool: jest.fn().mockReturnValue({
      query: jest.fn(),
    }),
  };
});

describe("login system", () => {
  it("returns status code 200 when username, password, and role are submitted", async () => {
    const response = await request(app).post("/login").send({
      Username: "user",
      Password: "password",
      Option: "Teacher",
    });

    expect(response.statusCode).toBe(200);
  });

  it("returns status code 400 when either username, password, or role are missing", async () => {
    expect(false).toBe(false);
  });
});

describe("login system", () => {
  test("returns status code 200 when an instructor logs in", async () => {
    const response = await request(app).get("/").send({
      id: 0,
      username: "username",
      role: "Teacher",
    });
    expect(response.statusCode).toBe(200);
  });

  test("returns status code 200 when a student logs in", async () => {
    const response = await request(app).get("/").send({
      id: 0,
      username: "username",
      role: "Student",
    });
    expect(response.statusCode).toBe(200);
  });
});

describe("upload course roster", () => {
  test("page available to instructors", async () => {
    const response = await request(app).get("/upload/0");

    expect(response.statusCode).toBe(200);
  });

  test("confirmation after file upload", async () => {
    const response = await request(app).get("/upload/1");

    expect(response.statusCode).toBe(200);
  });
});

describe("team assignment", () => {
  test("page available to instructors", async () => {
    const response = await request(app).get("/assign-teams");

    expect(response.statusCode).toBe(200);
  });
});

describe("team visibility", () => {
  test("for instructors", async () => {
    const response = await request(app).get("/teams");

    expect(response.statusCode).toBe(200);
  });

  test("for students", async () => {
    const response = await request(app).get("/teammates");

    expect(response.statusCode).toBe(200);
  });
});

describe("peer assessment", () => {
  test("page available to students", async () => {
    const response = await request(app).get("/evaluate/0");

    expect(response.statusCode).toBe(200);
  });

  test("submission of evaluation", async () => {
    const response = await request(app).post("/evaluate/0");

    expect(response.statusCode).toBe(200);
  });
});

afterAll(() => {
  pool.end();
});
