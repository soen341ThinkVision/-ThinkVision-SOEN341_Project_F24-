const request = require("supertest");
const app = require("../app");
const { Student } = require("../models");
const controllers = require("../controllers/controllers.js");

jest.mock("../config/db", () => ({
  execute: jest.fn().mockResolvedValue(),
}));
jest.mock("../models");

describe("team visibility", () => {
  const numOfStudents = 5;
  let students = [];
  for (let i = 1; i <= numOfStudents; i++) {
    students.push({
      id: i,
      username: `student_${i}`,
      team: 1,
    });
  }

  beforeEach(() => {
    Student.findAll.mockReset();
    Student.findByTeam.mockReset();

    Student.findAll.mockResolvedValue(students);
    Student.findByTeam.mockResolvedValue(students);
  });

  test("return code 200 when instructor requests to view teams", async () => {
    const response = await request(app).get("/teams");

    expect(Student.findAll).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  test("group students in the database by their team for instructor display", async () => {
    const response = await request(app).get("/teams");

    for (let i = 1; i <= numOfStudents; i++) {
      expect(response.text).toContain(`student_${i}`);
    }
    expect(Student.findAll).toHaveBeenCalled();
    expect(response.statusCode).toBe(200);
  });

  test("get a student's teammates from the database for viewing", async () => {
    const req = { session: { user: { team: 1, username: "student_1" } } };
    const res = { render: jest.fn() };

    await controllers.showTeammates(req, res);

    expect(Student.findByTeam).toHaveBeenCalledWith(req.session.user.team);
    expect(res.render).toHaveBeenCalledWith(
      "TeamVisibility.ejs",
      expect.objectContaining({
        teamMembers: expect.anything(),
        teamName: req.session.user.team,
      }),
    );
  });
});
