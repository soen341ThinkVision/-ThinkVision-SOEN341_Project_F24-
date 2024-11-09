require("dotenv").config();
const mysql = require("mysql2");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

// Sets up students table
pool.query("DROP TABLE IF EXISTS students", (error) => {
  const sql = `CREATE TABLE students (
        id int, 
        username varchar(255),
        password varchar(255), 
        team varchar(255))`;

  pool.query(sql, (err) => {
    if (err) console.log(err);
  });
});

// Sets up teachers table
pool.query("DROP TABLE IF EXISTS teachers", (error) => {
  const sql = `
    CREATE TABLE teachers (
        id int, 
        username varchar(255),
        password varchar(255))`;

  pool.query(sql, (err) => {
    if (err) console.log(err);
  });
});

// Sets up evaluations table
pool.query("DROP TABLE IF EXISTS evaluations", (error) => {
  const sql = `
    CREATE TABLE evaluations (
        id int AUTO_INCREMENT PRIMARY KEY,
        reviewee_id int, 
        category varchar(255), 
        score int, 
        comment text, 
        reviewer_id int)`;

  pool.query(sql, (err) => {
    if (err) console.log(err);
  });
});

pool.query("DROP TABLE IF EXISTS bribes", (error) => {
  const sql = `
    CREATE TABLE bribes (
        student_id int, 
        amount int, 
        grade varchar(255), 
        message text)`;

  pool.query(sql, (err) => {
    if (err) console.log(err);
  });
});

module.exports = pool.promise();
