const { Teacher, Student, Evaluation, Bribe, Message } = require("../models");
const csvtojson = require("csvtojson");
const { createReadStream, unlinkSync } = require("fs");
const _ = require("lodash");

// Home page
exports.homePage = (req, res) => {
  const { username: Username, role: Role } = req.session.user || {};
  res.render("MainPage.ejs", { Username, Role, MisconductAlert: "none" });
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
        console.log("Student successfully registered.");
        res.send({ registered: true });
      });
    }
  }

  if (Option === "Teacher") {
    const teacher = await Teacher.save(ID, Username, Password);
    console.log("Teacher successfully registered.");
    res.send({ registered: true });
  }
};

// Logs user into the system and directs them to their dashboard if successful
exports.signIn = async (req, res) => {
  console.log("Login request:", req.body);
  const { Username, Password, Option } = req.body;

  let misconductAlert = "none";
  const bribes = await Bribe.findAllReplied();

  let user = [];
  if (Option === "Student") {
    user = await Student.find(Username, Password);
    console.log(user);
    if (user.length > 0) {
      for (const bribe of bribes) {
        if (bribe.response != "refused" && bribe.student_id == user[0].id) {
          misconductAlert = "reported";
          break;
        } else if (bribe.student_id == user[0].id) {
          misconductAlert = "warn";
          break;
        }
      }
    }
  } else if (Option === "Teacher") {
    user = await Teacher.find(Username, Password);
    for (const bribe of bribes) {
      if (bribe.response == "accepted") {
        misconductAlert = "reported";
        break;
      }
    }
  }

  if (user.length > 0) {
    req.session.user = {
      id: user[0].id,
      username: user[0].username,
      role: Option,
      team: user[0].team,
    };

    console.log("Login successful:", req.session.user);

    res.render("MainPage.ejs", {
      Username: `${req.session.user.username}`,
      Role: `${req.session.user.role}`,
      MisconductAlert: misconductAlert,
      ID: `${req.session.user.id}`,
    });
  } else {
    console.log("User not found.");
    res.redirect("/login");
  }
};

// Adds students in the course through an uploaded csv file
exports.uploadFile = async (req, res) => {
  await csvtojson()
    .fromFile("./students.csv")
    .then(async (students) => {
      // deletes file once data has been extracted
      unlinkSync("./students.csv");

      if (students.length < 1) {
        console.log("Empty file, not processed.");
        res.status(400).send({ processed: false });
      } else {
        // saves students in the database
        for (let i = 0; i < students.length; i++) {
          await Student.save(students[i].ID, students[i].Name);
        }
        console.log("File processed successfully.");
        res.status(201).send({ processed: true });
      }
    })
    .catch((err) => {
      console.log(err);
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

  res.status(201).json({ message: "Data Updated" });
};

// Updates all students' teams
exports.assignAllStudents = async (req, res) => {
  if (req.body.size < 2) {
    res.status(400).send("Invalid team size");
  } else {
    var students = await Student.findAll();

    const numOfTeams = Math.ceil(students.length / req.body.size);

    students = _.shuffle(students);

    for (let i = 0; i < students.length; i++) {
      let team = (i % numOfTeams) + 1;
      await Student.updateTeam(students[i].id, team);
    }

    return res.status(201).send("Teams auto-assigned.");
  }
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
  if (!req.session.user.id) {
    return res.redirect("/login"); // Redirect to login page if user is not logged in
  }

  const teammateID = req.params.id;
  const reviewerID = req.session.user.id;

  console.log("Teammate ID:", teammateID);
  console.log("Reviewer ID:", reviewerID);

  if (!teammateID) {
    return res.status(400).send("Invalid teammate ID provided.");
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

  res.render("Confirmation.ejs", { teammate: teammateID }); // Redirect to teammates page after submission
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

exports.bribe = async (req, res) => {
  const studentID = req.session.user.id;
  const { amount, grade, message } = req.body;

  try {
    const response = await Bribe.findById(studentID);
    if (response.length > 0) {
      await Bribe.update(studentID, amount, grade, message);
      console.log("Bribe successfully updated.");
    } else {
      await Bribe.save(studentID, amount, grade, message);
      console.log("Bribe successfully added.");
    }
    res.redirect("/");
  } catch (err) {
    console.log(err);
  }
};

exports.bribeHandler = async (req, res) => {
  await Bribe.respond(req.params.studentID, req.params.decision);
  res.send(req.params.decision);
};

exports.bribeCenter = async (req, res) => {
  const result = await Bribe.findAll();
  let bribes = [];
  result.forEach((bribe) => {
    bribes.push(bribe);
  });
  res.render("BribeCenter.ejs", { bribes });
};

// Send a message
exports.sendMessage = async (req, res) => {
  const { receiverId, content } = req.body;
  const senderId = req.session.user.id;

  try {
    const result = await Message.save(senderId, receiverId, content);
    const message = {
      content: content,
      timestamp: new Date().toISOString(),
      sender_id: senderId,
    };
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send("Error sending message");
  }
};

// Retrieve messages for a user
exports.getMessages = async (req, res) => {
  const userId = req.session.user.id;
  const role = req.session.user.role;
  const receiverId = req.query.receiverId || null;

  try {
    let messages = [];
    let studentsByTeam = {};
    let teacher = null;

    if (role === "Teacher") {
      const students = await Student.findAll(); // Retrieve all students
      students.forEach((student) => {
        if (!studentsByTeam[student.team]) {
          studentsByTeam[student.team] = [];
        }
        studentsByTeam[student.team].push(student);
      });
      if (receiverId) {
        messages = await Message.findByUser(receiverId);
      }
    } else {
      teacher = await Teacher.findAll(); // Retrieve the teacher
      if (receiverId) {
        messages = await Message.findByUser(receiverId);
      }
    }

    res.render("Chat.ejs", {
      messages,
      studentsByTeam,
      teacher,
      receiverId,
      session: req.session,
    });
  } catch (error) {
    console.error("Error retrieving messages:", error);
    res.status(500).send("Error retrieving messages");
  }
};
