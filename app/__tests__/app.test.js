const request = require("supertest");
const app = require("../app");
const Teacher = require("../models/Teacher.js");
const Student = require("../models/Student.js");
const { writeFile } = require("fs").promises;

jest.mock("mysql2", () => {
  return {
    createPool: jest.fn(() => ({
      query: jest.fn(),
      promise: jest.fn(),
    })),
  };
});
jest.mock("../models/Teacher.js");
jest.mock("../models/Student.js");

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

  it("given course roster of x students, registers x students in the database", async () => {
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

  it("returns code 400 if file is empty or invalid", async () => {
    await writeFile("./__tests__/test_roster.csv", "ID,Name\n");

    const response = await request(app)
      .post("/upload/0")
      .attach("file", "./__tests__/test_roster.csv");

    expect(Student.save).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(400);
  });
});

describe("team assignment", () => {
  beforeEach(() => {
    Student.findAll.mockReset();
    Student.deleteTeam.mockReset();
    Student.updateTeam.mockReset();
  });

  it("every student is assigned a team when auto-assignment is selected", async () => {
    const teamSize = 10;
    const numOfStudents = 50;
    var students = [];
    for (let i = 0; i < numOfStudents; i++) {
      students.push(i);
    }
    Student.findAll.mockResolvedValue(students);

    const response = await request(app)
      .post("/assign-teams")
      .send({ size: teamSize });

    expect(Student.findAll).toHaveBeenCalled();
    expect(Student.updateTeam).toHaveBeenCalledTimes(numOfStudents);
    expect(response.statusCode).toBe(201);
  });

  test("calls to assign student teams in the database have valid arguments", async () => {
    const teamSize = 10;
    const numOfStudents = 50;
    const numOfTeams = Math.ceil(numOfStudents / teamSize);
    var students = [];
    for (let i = 0; i < numOfStudents; i++) {
      students.push({ id: i, username: `student_${i}` });
    }
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

  it("return code 400 if invalid team size of 0 or 1 is given", async () => {
    for (let teamSize = 0; teamSize < 2; teamSize++) {
      const response = await request(app)
        .post("/assign-teams")
        .send({ size: teamSize });

      expect(Student.findAll).not.toHaveBeenCalled();
      expect(Student.updateTeam).not.toHaveBeenCalled();
      expect(response.statusCode).toBe(400);
    }
    expect.assertions(6);
  });

  it("return code 201 after assigning an individual student to a team", async () => {
    const reqBody = { id: 0, team: 1 };
    const response = await request(app).put("/assign-teams").send(reqBody);

    expect(Student.updateTeam.mock.calls[0][0]).toBe(reqBody.id);
    expect(Student.updateTeam.mock.calls[0][1]).toBe(reqBody.team);
    expect(Student.deleteTeam).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(201);
  });

  it("individual students are removed from a team when requested", async () => {
    const reqBody = { id: 0, team: "-" };
    const response = await request(app).put("/assign-teams").send(reqBody);

    expect(Student.deleteTeam.mock.calls[0][0]).toBe(reqBody.id);
    expect(Student.updateTeam).not.toHaveBeenCalled();
    expect(response.statusCode).toBe(201);
  });
});

