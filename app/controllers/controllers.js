const db = require("../config/db.js");
const csvtojson = require("csvtojson");
const { createReadStream, unlinkSync } = require("fs");

// Home page
exports.homePage = (req, res) => {
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
    students = await db.query(sql);

    if (students[0].length < 1) {
      console.log("Student not in database.");
      res.send({ resgistered: false });
    } else {
      sql = `UPDATE students SET Password="${Password}" WHERE ID="${ID}"`;
      db.query(sql).then(() => {
        console.log("Student sucessfully registered.");
        res.send({ registered: true });
      });
    }
  }

  if (Option === "Teacher") {
    const sql = "INSERT INTO teachers (ID, Username, Password) VALUES (?,?,?)";
    db.query(sql, Values)
      .then(() => {
        console.log("Teacher sucessfully registered.");
        res.send({ registered: true });
      })
      .catch((err) => console.log(err));
  }
};

// Logs user into the system and directs them to their dashboard if successful
exports.signIn = (req, res) => {
  console.log("Received request for login", req.body);

  const { Username, Password, Option } = req.body;

  let sqlQuery;
  if (Option === "Student") {
    sqlQuery = `SELECT * FROM students WHERE Username='${Username}' AND Password='${Password}'`;
  } else if (Option === "Teacher") {
    sqlQuery = `SELECT * FROM teachers WHERE Username ='${Username}' AND Password='${Password}'`;
  }

  db.query(sqlQuery)
    .then((result) => {
      if (result[0].length > 0) {
        req.session.user = {
          id: result[0][0].ID,
          username: result[0][0].Username,
          role: Option,
          team: result[0][0].Team,
        };

        console.log("Login successful:", req.session.user);
        res.redirect("/");
      } else {
        console.log("User not found.");
        res.redirect("/login");
      }
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/login");
    });
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
  const result = await db.query(sql);

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
  const teamName = req.session.user.team;

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
  const teammateID = req.params.id;
  const reviewerID = req.session.user.id;

  let sql =
    `SELECT * FROM evaluations WHERE ` +
    `teammateID = ${teammateID} AND reviewerID = ${reviewerID}`;

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
};

exports.submitEvaluation = (req, res) => {
  const { teammateID, cooperation, comments } = req.body;
  const reviewerID = req.session.user.id;

  const sql =
    "INSERT INTO evaluations (teammateID, cooperation, comments, reviewerID) " +
    "VALUES (?, ?, ?, ?)";

  db.query(sql, [teammateID, cooperation, comments, reviewerID])
    .then(() => res.redirect("/teammates"))
    .catch((err) => console.log(err));
};
