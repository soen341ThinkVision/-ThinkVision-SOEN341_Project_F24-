require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

// Sets up students table
pool.query("DROP TABLE IF EXISTS students", (err) => {
  var createStudents =
    "CREATE TABLE students (ID int, Username varchar(255), " +
    "Password varchar(255), Team varchar(255));";

  pool.query(createStudents, (err) => {
    if (err) console.log("ERROR: ", err);
  });
});

// Sets up teachers table
pool.query("DROP TABLE IF EXISTS teachers", (err) => {
  var createTeachers =
    "CREATE TABLE teachers (ID int, Username varchar(255), " +
    "Password varchar(255));";

  pool.query(createTeachers, (err) => {
    if (err) console.log("ERROR: ", err);
  });
});

// Sets up evaluations table
pool.query("DROP TABLE IF EXISTS evaluations", (err) => {
  var createEvaluations =
    "CREATE TABLE evaluations (ID int AUTO_INCREMENT PRIMARY KEY, " +
    "teammateID int, TypeOfEval varchar(255), score int, comments text, reviewerID int);";

  pool.query(createEvaluations, (err) => {
    if (err) console.log("ERROR: ", err);
  });
});

module.exports = pool.promise();
