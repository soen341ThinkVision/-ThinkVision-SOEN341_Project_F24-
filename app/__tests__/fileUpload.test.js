const request = require("supertest");
const app = require("../app");
const { Student } = require("../models");
const { writeFile } = require("fs").promises;

jest.mock("../config/db", () => ({
  execute: jest.fn().mockResolvedValue(),
}));
jest.mock("../models");

describe("file upload", () => {
  beforeEach(() => {
    Student.save.mockReset();
  });

  test("return code 201 after processing csv file", async () => {
    await writeFile("./__tests__/test_roster.csv", "ID,Name\n");
    for (let i = 1; i <= 10; i++) {
      await writeFile("./__tests__/test_roster.csv", `${i},student_${i}\n`, {
        flag: "a",
      });
    }

    const response = await request(app)
      .post("/upload/0")
      .attach("file", "./__tests__/test_roster.csv");

    expect(response.statusCode).toBe(201);
  });

  test("given course roster of x students, register x students in the system", async () => {
    for (let students = 1; students < 50; students++) {
      Student.save.mockReset();
      await writeFile("./__tests__/test_roster.csv", "ID,Name\n");

      for (let j = 1; j <= students; j++) {
        await writeFile("./__tests__/test_roster.csv", `${j},student_${j}\n`, {
          flag: "a",
        });
      }

      const response = await request(app)
        .post("/upload/0")
        .attach("file", "./__tests__/test_roster.csv");

      expect(Student.save).toHaveBeenCalledTimes(students);
      expect(response.statusCode).toBe(201);
    }
  });

  test("return code 400 if file is empty", async () => {
    await writeFile("./__tests__/test_roster.csv", "ID,Name\n");

    const response = await request(app)
      .post("/upload/0")
      .attach("file", "./__tests__/test_roster.csv");

    expect(Student.save).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });
});
