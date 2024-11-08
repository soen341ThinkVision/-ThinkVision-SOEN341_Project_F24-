const { Teacher, Student, Evaluation, Bribe } = require("../models");
const csvtojson = require("csvtojson");
const { createReadStream, unlinkSync } = require("fs");
const _ = require("lodash");

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
  console.log("Registration request:", req.body);
  const { ID, Username, Password, Option } = req.body;

  if (Option === "Student") {
    // First check if student is in the system
    const student = await Student.findById(ID);

    if (student.length === 0) {
      console.log("Student not in database.");
      res.send({ registered: false });
    } else {
      Student.updatePassword(ID, Password).then(() => {
        console.log("Student sucessfully registered.");
        res.send({ registered: true });
      });
    }
  }

  if (Option === "Teacher") {
    const teacher = await Teacher.save(ID, Username, Password);
    console.log("Teacher sucessfully registered.");
    res.send({ registered: true });
  }
};

// Logs user into the system and directs them to their dashboard if successful
exports.signIn = async (req, res) => {
  console.log("Login request:", req.body);
  const { Username, Password, Option } = req.body;

  let user = [];
  if (Option === "Student") {
    user = await Student.find(Username, Password);
  } else if (Option === "Teacher") {
    user = await Teacher.find(Username, Password);
  }

  if (user.length > 0) {
    req.session.user = {
      id: user[0].id,
      username: user[0].username,
      role: Option,
      team: user[0].team,
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
    .then(async (students) => {
      // deletes file once data has been extracted
      unlinkSync("./students.csv");

      // saves students in the database
      for (let i = 0; i < students.length; i++) {
        await Student.save(students[i].ID, students[i].Name);
      }
    })
    .then(() => {
      console.log("File processed successfully.");
      res.end("File processed");
    })
    .catch((err) => {
      console.log("ERROR: ", err);
    });
};

// Team assignment page
exports.teamAssignment = async (req, res) => {
  const result = await Student.findAll();

  res.render("AssignTeams.ejs", { result });
};

// Changes a single student's team
exports.assignOneStudent = async (req, res) => {
  if (req.body.team === "-") {
    await Student.deleteTeam(req.body.id);
  } else {
    await Student.updateTeam(req.body.id, req.body.team);
  }

  res.json({ message: "Data Updated" });
};

// Updates all students' teams
exports.assignAllStudents = async (req, res) => {
  var students = await Student.findAll();

  var numOfTeams = Math.ceil(students.length / req.body.size);

  students = _.shuffle(students);

  for (let i = 0; i < students.length; i++) {
    let team = (i % numOfTeams) + 1;
    await Student.updateTeam(students[i].id, team);
  }

  return res.send("Teams auto-assigned.");
};

// Shows a student's teammates
exports.showTeammates = async (req, res) => {
  const teamMembers = await Student.findByTeam(req.session.user.team);

  let teammates = [];
  teamMembers.forEach((student) => {
    if (req.session.user.username != student.username) {
      teammates.push(student);
    }
  });

  res.render("TeamVisibility.ejs", {
    teamMembers: teammates,
    teamName: req.session.user.team,
  });
};

// Shows all teams and their members
exports.showAllTeams = async (req, res) => {
  const students = await Student.findAll();

  let teams = [];
  students.forEach((student) => {
    const { team, username, id } = student;
    if (!teams[team]) {
      teams[team] = [];
    }
    teams[team].push(student); // Add the student to the corresponding team
  });

  res.render("AllTeams.ejs", { teams });
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
    const result = await Evaluation.find(reviewerID, teammateID);

    const teammate = await Student.findById(teammateID);

    // If no evaluation exists, fetch teammate details and render the evaluation page
    if (result.length === 0) {
      res.render("Evaluation.ejs", { teammate: teammate[0] });
    } else {
      // Aggregating evaluation categories into a single object
      const review = {
        Teammate: teammate[0],
        Cooperation: null,
        WorkEthic: null,
        PracticalContribution: null,
        ConceptualContribution: null,
      };

      // Assign each evaluation category to the respective key
      result.forEach((evaluation) => {
        review[evaluation.category] = {
          score: evaluation.score,
          comments: evaluation.comment,
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

exports.submitEvaluation = (req, res) => {
  const { teammateID } = req.body;
  const reviewerID = req.session.user.id;

  // Collecting scores and comments for each category
  const evaluations = [
    {
      type: "Cooperation",
      score: req.body.score_cooperation,
      comments: req.body.comment_cooperation,
    },
    {
      type: "WorkEthic",
      score: req.body.score_ethics,
      comments: req.body.comment_ethics,
    },
    {
      type: "PracticalContribution",
      score: req.body.score_pcontribution,
      comments: req.body.comment_pcontribution,
    },
    {
      type: "ConceptualContribution",
      score: req.body.score_contribution,
      comments: req.body.comment_ccontribution,
    },
  ];

  // Loop through each category and insert into the database
  evaluations.forEach(async (evaluation) => {
    const { type, score, comments } = evaluation;

    await Evaluation.save(reviewerID, teammateID, type, score, comments);
  });

  res.redirect("/teammates"); // Redirect to teammates page after submission
};

exports.summary = async (req, res) => {
  try {
    const result = await Evaluation.getSummary();
    res.render("Summary.ejs", { evals: result });
  } catch (error) {
    console.error("Error fetching evaluations:", error);
    res.status(500).send("Error retrieving evaluations");
  }
};

exports.detailedResults = async (req, res) => {
  try {
    const result = await Evaluation.getDetailed();
    const teams = {};

    result.forEach((row) => {
      if (!teams[row.team]) {
        teams[row.team] = [];
      }
      teams[row.team].push({
        id: row.id,
        name: row.username,
        reviewer: row.Reviewer,
        team: row.team,
        avgCoop: row.AvgCoop,
        avgEthics: row.AvgEthics,
        avgConceptual: row.AvgConceptual,
        avgPractical: row.AvgPractical,
        totalAvg: row.TotalAvg,
        comments: row.Comments,
      });
    });
    res.render("DetailedView.ejs", { teams });
  } catch (error) {
    console.error("Error fetching detailed results:", error);
    res.status(500).send("Error retrieving detailed results");
  }
};

exports.Bribe = async (req, res) => {
  const studentID = req.session.user.id;
  const { amount, grade, message } = req.body;

  try {
    await Bribe.save(studentID, amount, grade, message);
    console.log("Bribe sucessfully added.");
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

exports.AllBribes = async (req, res) => {
  const result = await Bribe.findAll();

  let bribes = [];
  if (result.length > 0) {
    result.forEach((bribe) => {
      bribes.push(bribe);
    });
    res.render("OfferedBribes.ejs", { bribes });
  }
};
