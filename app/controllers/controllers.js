const db = require("../config/db.js");
const Teacher = require("../models/Teacher");
const Student = require("../models/Student");
const csvtojson = require("csvtojson");
const { createReadStream, unlinkSync } = require("fs");

// Home page
exports.homePage = (req, res) => {
  if (Object.keys(req.body).length != 0) {
    req.session.user = {
      id: req.body.id,
      username: req.body.username,
      role: req.body.role,
      team: req.body.team,
    };
  }
  const { username: Username, role: Role } = req.session.user || {};
  res.render("MainPage.ejs", { Username, Role });
};

// Registers user into the system
exports.register = async (req, res) => {
  console.log("Request for registration: ", req.body);
  const { ID, Username, Password, Option } = req.body;
  const Values = [ID, Username, Password];

  if (Option === "Student") {
    // Check if student is in the system first
    let sql = `SELECT * FROM students WHERE ID=${Values[0]}`;
    const students = await db.query(sql);

    if (students[0].length < 1) {
      console.log("Student not in database.");
      res.send({ registered: false });
    } else {
      sql = `UPDATE students SET Password="${Password}" WHERE ID="${ID}"`;
      db.query(sql).then(() => {
        console.log("Student sucessfully registered.");
        res.send({ registered: true });
      });
    }
  }

  if (Option === "Teacher") {
    try {
      const teacher = await new Teacher(ID, Username, Password).save();
      console.log("Teacher sucessfully registered.");
      res.send({ registered: true });
    } catch (error) {
      console.log(error);
    }
  }
};

// Logs user into the system and directs them to their dashboard if successful
exports.signIn = async (req, res) => {
  console.log("Received request for login", req.body);

  const { Username, Password, Option } = req.body;
  let user = {};

  if (Option === "Student") {
    user = await Student.find(Username, Password);
  } else if (Option === "Teacher") {
    user = await Teacher.find(Username, Password);
  }

  if (user[0].length > 0) {
    req.session.user = {
      id: user[0][0].ID,
      username: user[0][0].Username,
      role: Option,
      team: user[0][0].Team,
    };

    console.log("Login successful:", req.session.user);
    res.redirect("/");
  } else {
    console.log("User not found.");
    res.redirect("/login");
  }
};

// Adds students in the course through an uploaded csv file
exports.uploadFile = (req, res) => {
  csvtojson()
    .fromFile("./students.csv")
    .then((source) => {
      unlinkSync("./students.csv");

      for (let i = 0; i < source.length; i++) {
        let insertsql =
          "INSERT INTO students (ID, Username) VALUES " +
          `(${source[i].ID}, '${source[i].Name}')`;

        db.query(insertsql).catch((err) => {
          console.log("Unable to insert student #", values[0]);
          return console.log(err);
        });
      }
    })
    .then(() => {
      console.log("File processed successfully.");
      res.end("File processed");
    })
    .catch((err) => {
      console.log(err);
    });
};

// Team assignment page
exports.teamAssignment = async (req, res) => {
  const sql = "SELECT ID, Username, Team FROM students ORDER BY Team ASC";
  const result = await db.query(sql); // const sql = "INSERT INTO teachers (ID, Username, Password) VALUES (?,?,?)";
  // db.query(sql, Values)
  //   .then(() => {
  //     console.log("Teacher sucessfully registered.");
  //     res.send({ registered: true });
  //   })
  //   .catch((err) => console.log(err));

  res.render("AssignTeams.ejs", { result });
};

// Changes a single student's team
exports.assignOneStudent = (req, res) => {
  const id = req.body.id;

  let sql;
  if (req.body.team === "-") {
    sql = `UPDATE students SET Team= NULL WHERE ID = ${id}`;
  } else {
    sql = `UPDATE students SET Team= "${req.body.team}" WHERE ID = ${id}`;
  }

  db.query(sql)
    .then(() => res.json({ message: "Data Updated" }))
    .catch((err) => console.log(err));
};

// Updates all students' teams
exports.assignAllStudents = (req, res) => {
  const sql = "SELECT * FROM students";
  db.query(sql).then((result) => {
    var numOfStudents = result[0].length;
    var numOfTeams = Math.ceil(numOfStudents / req.body.size);
    for (let i = 0; i < numOfStudents; i++) {
      let team = (i % numOfTeams) + 1;
      db.query(
        `UPDATE students SET Team ='${team}' WHERE ID=${result[0][i].ID}`
      );
    }
    return res.send("Teams auto-assigned.");
  });
};

// Shows a student's teammates
exports.showTeammates = (req, res) => {
  if (req.session.user) {
    var teamName = req.session.user.team;

    const teamQuery = `SELECT * FROM students WHERE Team ='${teamName}'`;

    db.query(teamQuery).then((result) => {
      if (result[0].length > 0) {
        let teammates = [];
        result[0].forEach((student) => {
          if (req.session.user.username != student.Username) {
            teammates.push(student);
          }
        });

        res.render("TeamVisibility.ejs", {
          teamMembers: teammates,
          teamName: teamName,
        });
      }
    });
  } else {
    res.sendStatus(200);
  }
};

// Shows all teams and their members
exports.showAllTeams = (req, res) => {
  db.query("SELECT Team, Username, ID FROM students ORDER BY Team ASC").then(
    (result) => {
      let teams = {};
      result[0].forEach((student) => {
        const { Team, Username, ID } = student;
        if (!teams[Team]) {
          teams[Team] = [];
        }
        teams[Team].push(student); // Add the student to the corresponding team
      });

      res.render("AllTeams.ejs", { teams });
    }
  );
};

// Handles teammate evaluation
exports.evaluateTeammate = async (req, res) => {
  if (req.session.user) {
    var teammateID = req.params.id;
    var reviewerID = req.session.user.id;

    var sql =
      `SELECT * FROM evaluations WHERE teammateID = ${teammateID} ` +
      `AND reviewerID = ${reviewerID}`;

    const result = await db.query(sql);

    // Checks if an evaluation has been submitted already
    if (result[0].length > 0) {
      res.render("ViewEvaluation.ejs", { review: result[0][0] });
    } else {
      sql = `SELECT ID, Username FROM students WHERE ID = ${teammateID}`;
      db.query(sql)
        .then((teammate) => {
          res.render("Evaluation.ejs", { teammate: teammate[0][0] });
        })
        .catch((err) => console.log(err));
    }
  } else {
    res.sendStatus(200);
  }
};

exports.submitEvaluation = (req, res) => {
  if (req.session.user) {
    const { teammateID, TypeOfEval, score, comments } = req.body;
    const reviewerID = req.session.user.id;

    const sql =
      "INSERT INTO evaluations (teammateID, TypeOfEval, score, comments, reviewerID) " +
      "VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [teammateID, TypeOfEval, score, comments, reviewerID])
      .then(() => res.redirect("/teammates"))
      .catch((err) => console.log(err));
  } else {
    res.sendStatus(200);
  }
};

exports.allEval = (req, res) => {
  const sql = `
    SELECT 
      s.ID,
      s.Username,
      s.Team,
      COUNT(e.ID) AS EvaluationCount,
      AVG(IF(e.TypeOfEval = 'Coop', e.score, NULL)) AS AvgCoop,
      AVG(IF(e.TypeOfEval = 'Ethics', e.score, NULL)) AS AvgEthics,
      AVG(IF(e.TypeOfEval = 'ConceptualContribution', e.score, NULL)) AS AvgConceptualContribution,
      AVG(IF(e.TypeOfEval = 'PracticalContribution', e.score, NULL)) AS AvgPracticalContribution,
      AVG(e.score) AS TotalAvg
    FROM 
      Students s
    LEFT JOIN 
      Evaluations e ON s.ID = e.teammateID
    GROUP BY 
      s.ID, s.Username
    ORDER BY 
      s.ID ASC;
  `;

  db.query(sql)
    .then(([result]) => {
      res.render("Summary.ejs", { evals: result });
    })
    .catch((error) => {
      console.error("Error fetching evaluations:", error);
      res.status(500).send("Error retrieving evaluations");
    });
};
