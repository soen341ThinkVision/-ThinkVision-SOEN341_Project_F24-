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
  // Check if user is logged in (session should exist)
  if (!req.session.user || !req.session.user.id) {
    return res.redirect("/login"); // Redirect to login page if user is not logged in
  }

  const teammateID = req.params.id;
  const reviewerID = req.session.user.id;

  console.log("Teammate ID:", teammateID);
  console.log("Reviewer ID:", reviewerID);

  if (!teammateID || !reviewerID) {
    return res.status(400).send("Invalid IDs provided.");
  }

  try {
    // Query to check if the current reviewer has already evaluated the teammate
    let sql = `
      SELECT 
        TypeOfEval, score, comments
      FROM evaluations 
      WHERE teammateID = ${teammateID} AND reviewerID = ${reviewerID}
    `;
    const result = await db.query(sql);

    // If no evaluation exists, fetch teammate details and render the evaluation page
    if (result[0].length === 0) {
      sql = `SELECT ID, Username FROM students WHERE ID = ${teammateID}`;
      const teammate = await db.query(sql);
      
      res.render("Evaluation.ejs", { teammate: teammate[0][0] });
    } else {
      // Aggregating evaluation categories into a single object
      const review = {
        Cooperation: null,
        WorkEthic: null,
        PracticalContribution: null,
        ConceptualContribution: null,
      };

      // Assign each evaluation category to the respective key
      result[0].forEach(evaluation => {
        review[evaluation.TypeOfEval] = {
          score: evaluation.score,
          comments: evaluation.comments
        };
      });

      // Render the ViewEvaluation page with the structured review data
      res.render("ViewEvaluation.ejs", { review });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Error occurred while processing the evaluation.");
  }
};



exports.allEval = (req,res) => {
  const sql = `
    SELECT 
      s.ID,
      s.Username,
      s.Team,
      COUNT(e.ID) AS EvaluationCount,
      AVG(IF(e.TypeOfEval = 'Cooperation', e.score, NULL)) AS AvgCoop,
      AVG(IF(e.TypeOfEval = 'WorkEthic', e.score, NULL)) AS AvgEthics,
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
  
  db.query(sql).then(
    ([result]) => {
      res.render("Summary.ejs", { evals: result });
    }
  ).catch((error) => {
    console.error("Error fetching evaluations:", error);
    res.status(500).send("Error retrieving evaluations");
  });
};


exports.submitEvaluation = (req, res) => {
  const { teammateID } = req.body;
  const reviewerID = req.session.user.id;

  // Collecting scores and comments for each category
  const evaluations = [
    { type: 'Cooperation', score: req.body.score_cooperation, comments: req.body.comment_cooperation },
    { type: 'WorkEthic', score: req.body.score_ethics, comments: req.body.comment_ethics },
    { type: 'PracticalContribution', score: req.body.score_pcontribution, comments: req.body.comment_pcontribution },
    { type: 'ConceptualContribution', score: req.body.score_contribution, comments: req.body.comment_ccontribution }
  ];

  // Loop through each category and insert into the database
  evaluations.forEach(evaluation => {
    const { type, score, comments } = evaluation;

    const sql =
      "INSERT INTO evaluations (teammateID, TypeOfEval, score, comments, reviewerID) " +
      "VALUES (?, ?, ?, ?, ?)";

    db.query(sql, [teammateID, type, score, comments, reviewerID], (err, result) => {
      if (err) {
        console.log(err);
      }
    });
  });

  res.redirect("/teammates"); // Redirect to teammates page after submission
};




exports.detailedResults = async (req, res) => {
  const sql = `
    SELECT 
      s.ID,
      s.Username,
      s.Team,
      AVG(IF(e.TypeOfEval = 'Cooperation', e.score, NULL)) AS AvgCoop,
      AVG(IF(e.TypeOfEval = 'WorkEthic', e.score, NULL)) AS AvgEthics,
      AVG(IF(e.TypeOfEval = 'ConceptualContribution', e.score, NULL)) AS AvgConceptualContribution,
      AVG(IF(e.TypeOfEval = 'PracticalContribution', e.score, NULL)) AS AvgPracticalContribution,
      AVG(e.score) AS TotalAvg,
      GROUP_CONCAT(CONCAT(r.Username, ': ', e.comments) SEPARATOR '; ') AS comments
    FROM 
      Students s
    LEFT JOIN 
      Evaluations e ON s.ID = e.teammateID
    LEFT JOIN 
      Students r ON e.reviewerID = r.ID
    GROUP BY 
      s.ID, s.Username, s.Team
    ORDER BY 
      s.Team ASC, s.ID ASC;
  `;

  try {
    const [result] = await db.query(sql);
    const teams = {};

    result.forEach((row) => {
      if (!teams[row.Team]) {
        teams[row.Team] = [];
      }
      teams[row.Team].push({
        id: row.ID,
        name: row.Username,
        team: row.Team,
        avgCoop: row.AvgCoop,
        avgEthics: row.AvgEthics,
        avgConceptualContribution: row.AvgConceptualContribution,
        avgPracticalContribution: row.AvgPracticalContribution,
        totalAvg: row.TotalAvg,
        comments: row.comments,
      });
    });

    res.render('DetailedView.ejs', { teams });
  } catch (error) {
    console.error('Error fetching detailed results:', error);
    res.status(500).send('Error retrieving detailed results');
  }
};

exports.Bribe = async (req,res) => {
  const StudentID = req.session.user.id;
  const {amount, grade, message} = req.body;
  
  const Values = [StudentID, amount, grade, message];
  
  const sql =
  "INSERT INTO bribes (StudentID, BribeAmount, GradeWanted, Message) VALUES (?,?,?,?)";
  
  db.query(sql, Values)
        .then(() => {
          console.log("Bribe sucessfully added.");
          res.redirect("/");
        })
    .catch((err) => console.log(err));
  }
  
  exports.AllBribes = (req,res) => {
  
  const sql =
  "SELECT * FROM bribes";
  
  db.query(sql).then(
    (result) => {
      let bribes = []
      if(result[0].length > 0) {
        result[0].forEach((bribe) => {
          bribes.push(bribe)
        })
        res.render("OfferedBribes.ejs", {bribes});
      }
    }
  )
  }
