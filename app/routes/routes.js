const router = require("express").Router();
const db = require("../config/db.js");
const multer = require("multer");
const csvtojson = require("csvtojson");
const { createReadStream, unlinkSync } = require("fs");

// Sets up file storage and naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, "students.csv");
  },
});
const upload = multer({ storage: storage, limits: { fileSize: 10000000 } });

// Home page
router.get("/", (req, res) => {
  const { username: Username, role: Role } = req.session.user || {};
  res.render("MainPage.ejs", { Username, Role });
});

// Login page
router.get("/login", (req, res) => {
  res.render("Login.ejs");
});

// Sign up page
router.get("/sign-up", (req, res) => {
  res.render("SignUp.ejs");
});

// Upload course roster page
router.get("/upload/:uploaded", (req, res) => {
  const { uploaded } = req.params;
  res.render("Upload.ejs", { uploaded });
});

// Team assignment page
router.get("/assign-teams", (req, res) => {
  res.render("AssignTeams.ejs");
});

// Gets all students in the course
router.get("/get-students", (req, res) => {
  db.query("SELECT ID, Username, Team FROM students ORDER BY Team ASC")
    .then((results) => res.send(results[0]))
    .catch((err) => console.log(err));
});

// Changes a single student's team
router.put("/assign-teams", (req, res) => {
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
});

// Updates all students' teams
router.post("/assign-teams", (req, res) => {
  db.query("SELECT * FROM students").then((result) => {
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
});

// Logouts user and redirects to homepage
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/");
  });
});

// Shows a student's teammates
router.get("/TeamVis", (req, res) => {
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
});

// Shows all teams
router.get("/AllTeamVis", (req, res) => {
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
});

// Registers user into the db
router.put("/sign-up", (req, res) => {
  console.log("Received POST request for registration", req.body);

  const { ID, Username, Password, Option } = req.body;
  const Values = [ID, Username, Password];

  if (Option === "Student") {
    // Check if student is in the system first
    const select = `SELECT * FROM students WHERE ID=${Values[0]}`;

    db.query(select)
      .then((result) => {
        if (result[0].length < 1) {
          console.log("Student not in database.");
          res.send({ resgistered: false });
        } else {
          const update = `UPDATE students SET Password="${Password}" WHERE ID="${ID}"`;
          db.query(update).then(() => {
            console.log("Student sucessfully registered.");
            res.send({ registered: true });
          });
        }
      })
      .catch((err) => console.log(err));
  }

  // Adds teacher to the system
  if (Option === "Teacher") {
    const insert =
      "INSERT INTO teachers (ID, Username, Password) VALUES (?,?,?)";
    db.query(insert, Values)
      .then(() => {
        console.log("Teacher sucessfully registered.");
        res.send({ registered: true });
      })
      .catch((err) => console.log(err));
  }
});

// Logs user into the system and directs them to their dashboard if successful
router.post("/LogUser", (req, res) => {
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
    .catch((err) => console.log(err));
});

// Adds students in the course through an uploaded csv file
router.post("/upload-students", upload.single("file"), (req, res) => {
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
    .then(() => console.log("File processed successfully."));
});

// Renders the evaluation page or views an existing review
router.get("/evaluate/:id", (req, res) => {
  const teammateID = req.params.id;
  const reviewerID = req.session.user.id;

  const sqlQuery =
    `SELECT * FROM evaluations WHERE ` +
    `teammateID = ${teammateID} AND reviewerID = ${reviewerID}`;
  db.query(sqlQuery)
    .then((result) => {
      // Checks if review has already been submitted
      if (result[0].length > 0) {
        res.render("ViewEvaluation.ejs", { review: result[0][0] });
      } else {
        // No review exists, render the evaluation page
        const query = `SELECT ID, Username FROM students WHERE ID = ${teammateID}`;
        db.query(query)
          .then((teammate) => {
            res.render("Evaluation.ejs", { teammate: teammate[0][0] });
          })
          .catch((err) => console.log(err));
      }
    })
    .catch((err) => console.log(err));
});

// Submits a student's evaluation of a teammate
router.post("/submit-evaluation", (req, res) => {
  const { teammateID, cooperation, comments } = req.body;
  const reviewerID = req.session.user.id;

  const insertQuery =
    "INSERT INTO evaluations (teammateID, cooperation, comments, reviewerID) " +
    "VALUES (?, ?, ?, ?)";

  db.query(insertQuery, [teammateID, cooperation, comments, reviewerID])
    .then(() => res.redirect("/TeamVis"))
    .catch((err) => console.log(err));
});

module.exports = router;
