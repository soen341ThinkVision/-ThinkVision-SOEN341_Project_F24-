//Importing Libraries (npm)
const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const session = require("express-session");
const { createReadStream, unlinkSync } = require("fs");
const multer = require("multer");
const csvtojson = require("csvtojson");

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.static("css"));

app.use(
  session({
    secret: "BreakingBad", // Use a strong secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Database connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "pas",
});

// Terminal listen notification
app.listen(5002, () => {
  console.log("Server running on port 5002");
});

// Database connection notification
db.connect((err) => {
  if (err) {
    console.log("Error connecting to database");
  } else {
    console.log("MySql database connected");
    db.query("DROP TABLE students", (err, drop) => {
      var createStudents =
        "CREATE TABLE students (ID int, Username varchar(255), " +
        "Password varchar(255), Team varchar(255));";

      db.query(createStudents, (err, drop) => {
        if (err) console.log("ERROR: ", err);
      });
    });
    db.query("DROP TABLE teachers", (err, drop) => {
      var createTeachers =
        "CREATE TABLE teachers (ID int, Username varchar(255), " +
        "Password varchar(255));";

      db.query(createTeachers, (err, drop) => {
        if (err) console.log("ERROR: ", err);
      });

      db.query("INSERT INTO teachers VALUES (1, 'Z', 1)");
    });
  }
});

// Sets up file storage and naming
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, "students.csv");
  },
});
const upload = multer({ storage: storage, limits: { fileSize: 10000000 } });

// Routes

app.get("/", (req, res) => {
  const { username: Username, role: Role } = req.session.user || {};
  res.render("MainPage.ejs", { Username, Role });
});

app.get("/login", (req, res) => {
  res.render("Login.ejs");
});

app.get("/SignUp", (req, res) => {
  res.render("SignUp.ejs");
});

app.get("/Upload", (req, res) => {
  var uploaded = false;
  res.render("Upload.ejs", { uploaded });
});

app.get("/upload-complete", (req, res) => {
  var uploaded = true;
  res.render("Upload.ejs", { uploaded });
});

app.get("/assign-teams", (req, res) => {
  res.render("AssignTeams.ejs");

  // var query = "SELECT ID, Username, Team FROM students ORDER BY Team ASC";
  // db.query(query, (err, data) => {
  // if (err) {
  //   throw err;
  // } else {
  //   res.render("AssignTeams.ejs", {
  //     action: "list",
  //     sampleData: data,
  //   });
  // }
  // });
});

app.get("/get_students", (req, res) => {
  const sql = "SELECT ID, Username, Team FROM students ORDER BY Team ASC";

  db.query(sql, (err, results) => {
    if (err) {
      throw err;
    } else {
      res.send(results);
    }
  });
});

app.post("/update_team", (req, res) => {
  const id = req.body.id;
  if (req.body.team === "-") {
    var sql = `UPDATE students SET Team= NULL WHERE ID = "${id}"`;
  } else {
    var sql = `UPDATE students SET Team= "${req.body.team}" WHERE ID = "${id}"`;
  }

  db.query(sql, (err, results) => {
    if (err) {
      throw err;
    } else {
      res.json({ message: "Data Updated" });
    }
  });
});

app.get("/Logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return console.log(err);
    }
    res.redirect("/");
  });
});

// POSTS

app.post("/Register", (req, res) => {
  console.log("Recieved POST body request for registration", req.body);

  const { ID, Username, Password, Option } = req.body;

  const Values = [ID, Username, Password];

  let insertQuery;

  if (Option === "Student") {
    insertQuery =
      "INSERT INTO students (ID, Username, Password) VALUES (?,?,?)";
  }

  if (Option === "Teacher") {
    insertQuery =
      "INSERT INTO teachers (ID, Username, Password) VALUES (?,?,?)";
  }

  db.query(insertQuery, Values, (err, result) => {
    if (err) {
      console.log("Error registering user");
      console.log(err);
    } else {
      console.log("User sucessfully added");
      res.redirect("/login");
    }
  });
});

app.post("/LogUser", (req, res) => {
  console.log("Recieved POST body request for login", req.body);

  const { Username, Password, Option } = req.body;

  let TryQuery;

  if (Option === "Student") {
    TryQuery = "SELECT * FROM students WHERE Username = ?";
  }

  if (Option === "Teacher") {
    TryQuery = "SELECT * FROM teachers WHERE Username = ?";
  }

  console.log("Executing query:", TryQuery, "with Username:", Username);

  db.query(TryQuery, Username, (err, result) => {
    if (result.length > 0) {
      if (result[0].Password == Password) {
        console.log("User Sucessfully Logged In");
        req.session.user = {
          id: result[0].ID,
          username: result[0].Username,
          role: Option,
        };

        console.log("Session after login:", req.session.user);
        res.redirect("/");
      } else {
        console.log("Wrong Password");
      }
    } else {
      console.log("User Was not found");
    }
  });
});

app.post("/upload-students", upload.single("file"), (req, res) => {
  csvtojson()
    .fromFile("uploads/students.csv")
    .then((source) => {
      unlinkSync("uploads/students.csv");

      for (let i = 0; i < source.length; i++) {
        let values = [];
        values.push(source[i].ID, source[i].Name);
        let insertStatement =
          "INSERT INTO students (ID, Username) VALUES (?, ?)";

        db.query(insertStatement, values, (err, results, fields) => {
          if (err) {
            console.log("Unable to insert student #", values[0]);
            return console.log(err);
          }
        });
      }
    });
});

function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect("/login");
  }
}
