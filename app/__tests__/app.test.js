const request = require("supertest");
const app = require("../app");
const { Teacher, Student, Evaluation } = require("../models");
const controllers = require("../controllers/controllers.js");
const { writeFile } = require("fs").promises;

jest.mock("mysql2", () => {
  return {
    createPool: jest.fn(() => ({
      query: jest.fn(),
      promise: jest.fn(),
    })),
  };
});
jest.mock("../models");
global.console.log = jest.fn();

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
      const response = await request(app)
        .post("/login")
        .send({
          Option: `${role}`,
        });
    }

    expect(Student.find).toHaveBeenCalledTimes(1);
    expect(Teacher.find).toHaveBeenCalledTimes(1);
  });

  test("do not log in if user is not found", async () => {
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

  test("do not login if any of username, password, or role are missing", async () => {
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

describe("team assignment", () => {
  beforeEach(() => {
    Student.findAll.mockReset();
    Student.deleteTeam.mockReset();
    Student.updateTeam.mockReset();
  });

  var teamSize = 10;
  var numOfStudents = 50;
  var students = [];
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

describe("team visibility", () => {
  var numOfStudents = 5;
  var students = [];
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
      })
    );
  });
});

describe("peer assessment", () => {
  beforeEach(() => {
    Student.findById.mockReset();
    Evaluation.find.mockReset();
    Evaluation.save.mockReset();
  });

  test("select teammate for evaluation", async () => {
    const teammate = { id: 2 };
    const req = { session: { user: { id: 1 } }, params: { id: teammate.id } };
    const res = { render: jest.fn() };
    Evaluation.find.mockResolvedValue([]);
    Student.findById.mockResolvedValue([teammate]);

    await controllers.evaluateTeammate(req, res);

    expect(Evaluation.find).toHaveBeenCalledWith(
      req.session.user.id,
      teammate.id
    );
    expect(Student.findById).toHaveBeenCalledWith(teammate.id);
    expect(res.render).toHaveBeenCalledWith("Evaluation.ejs", {
      teammate: teammate,
    });
  });

  test("return code 400 if teammate ID is not provided", async () => {
    const req = { session: { user: { id: 1 } }, params: {} };
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };

    await controllers.evaluateTeammate(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  test("retrieve peer evaluation if one has been already submitted", async () => {
    const teammate = { id: 2 };
    const req = { session: { user: { id: 1 } }, params: { id: teammate.id } };
    const res = { render: jest.fn() };
    const review = {
      Teammate: teammate,
      Cooperation: { score: 1, comments: "" },
      WorkEthic: { score: 1, comments: "" },
      PracticalContribution: null,
      ConceptualContribution: null,
    };
    Student.findById.mockResolvedValue([teammate]);
    Evaluation.find.mockResolvedValue([
      {
        category: "Cooperation",
        score: review.Cooperation.score,
        comment: review.Cooperation.comments,
      },
      {
        category: "WorkEthic",
        score: review.WorkEthic.score,
        comment: review.WorkEthic.comments,
      },
    ]);

    await controllers.evaluateTeammate(req, res);

    expect(res.render).toHaveBeenCalledWith("ViewEvaluation.ejs", { review });
  });

  test("save peer assessment on cooperation to the database", async () => {
    const teammate = { id: 2 };
    const req = {
      session: { user: { id: 1 } },
      body: {
        teammateID: teammate.id,
        score_cooperation: 1,
        comment_cooperation: "",
      },
    };
    const res = { redirect: jest.fn() };

    await controllers.submitEvaluation(req, res);

    expect(Evaluation.save).toHaveBeenCalledWith(1, 2, "Cooperation", 1, "");
    expect(res.redirect).toHaveBeenCalledWith("/teammates");
  });

  test("save peer assessment on work ethic to the database", async () => {
    const teammate = { id: 2 };
    const req = {
      session: { user: { id: 1 } },
      body: {
        teammateID: teammate.id,
        score_ethics: 1,
        comment_ethics: "",
      },
    };
    const res = { redirect: jest.fn() };

    await controllers.submitEvaluation(req, res);

    expect(Evaluation.save).toHaveBeenCalledWith(1, 2, "WorkEthic", 1, "");
    expect(res.redirect).toHaveBeenCalledWith("/teammates");
  });

  test("save peer assessment on practical contribution to the database", async () => {
    const teammate = { id: 2 };
    const req = {
      session: { user: { id: 1 } },
      body: {
        teammateID: teammate.id,
        score_pcontribution: 1,
        comment_pcontribution: "",
      },
    };
    const res = { redirect: jest.fn() };

    await controllers.submitEvaluation(req, res);

    expect(Evaluation.save).toHaveBeenCalledWith(
      1,
      2,
      "PracticalContribution",
      1,
      ""
    );
    expect(res.redirect).toHaveBeenCalledWith("/teammates");
  });

  test("save peer assessment on conceptual cooperation to the database", async () => {
    const teammate = { id: 2 };
    const req = {
      session: { user: { id: 1 } },
      body: {
        teammateID: teammate.id,
        score_contribution: 1,
        comment_ccontribution: "",
      },
    };
    const res = { redirect: jest.fn() };

    await controllers.submitEvaluation(req, res);

    expect(Evaluation.save).toHaveBeenCalledWith(
      1,
      2,
      "ConceptualContribution",
      1,
      ""
    );
    expect(res.redirect).toHaveBeenCalledWith("/teammates");
  });
});
