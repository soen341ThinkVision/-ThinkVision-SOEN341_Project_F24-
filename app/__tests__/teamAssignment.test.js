const request = require("supertest");
const app = require("../app");
const { Student } = require("../models");

jest.mock("../config/db", () => ({
  execute: jest.fn().mockResolvedValue(),
}));
jest.mock("../models");

describe("team assignment", () => {
  beforeEach(() => {
    Student.findAll.mockReset();
    Student.deleteTeam.mockReset();
    Student.updateTeam.mockReset();
  });

  const teamSize = 10;
  const numOfStudents = 50;
  let students = [];
  for (let i = 1; i <= numOfStudents; i++) {
    students.push({ id: i, username: `student_${i}` });
  }

  test("assign a team to every student when auto-assignment is selected", async () => {
    Student.findAll.mockResolvedValue(students);

    const response = await request(app)
      .post("/assign-teams")
      .send({ size: teamSize });

    expect(Student.findAll).toHaveBeenCalled();
    expect(Student.updateTeam).toHaveBeenCalledTimes(numOfStudents);
    expect(response.statusCode).toBe(201);
  });

  test("verify calls to assign teams in the database have valid arguments", async () => {
    const numOfTeams = Math.ceil(numOfStudents / teamSize);

    Student.findAll.mockResolvedValue(students);

    const response = await request(app)
      .post("/assign-teams")
      .send({ size: teamSize });

    for (let team = 1; team <= numOfTeams; team++) {
      expect(Student.updateTeam).toHaveBeenCalledWith(expect.any(Number), team);
    }
    expect(Student.findAll).toHaveBeenCalled();
    expect(Student.updateTeam).toHaveBeenCalledTimes(numOfStudents);
    expect(response.statusCode).toBe(201);
  });

  test("return code 400 if invalid team size of 0 or 1 is given", async () => {
    for (let i = 0; i < 2; i++) {
      const response = await request(app)
        .post("/assign-teams")
        .send({ size: i });

      expect(Student.findAll).not.toHaveBeenCalled();
      expect(Student.updateTeam).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    }
    expect.assertions(6);
  });

  test("return code 201 after assigning an individual student to a team", async () => {
    const reqBody = { id: 0, team: 1 };
    const response = await request(app).put("/assign-teams").send(reqBody);

    expect(Student.updateTeam.mock.calls[0][0]).toBe(reqBody.id);
    expect(Student.updateTeam.mock.calls[0][1]).toBe(reqBody.team);
    expect(Student.deleteTeam).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(201);
  });

  test("remove individual students from a team when requested", async () => {
    const reqBody = { id: 0, team: "-" };
    const response = await request(app).put("/assign-teams").send(reqBody);

    expect(Student.deleteTeam.mock.calls[0][0]).toBe(reqBody.id);
    expect(Student.updateTeam).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(201);
  });
});
