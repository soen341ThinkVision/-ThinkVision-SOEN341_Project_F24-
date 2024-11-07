const request = require("supertest");
const app = require("../app");
const pool = require("../config/db");

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
