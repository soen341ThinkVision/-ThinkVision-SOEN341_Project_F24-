const db = require("../config/db");

db.execute("DROP TABLE IF EXISTS students").then(async () => {
  const sql = `CREATE TABLE students (
    id int, 
    username varchar(255),
    password varchar(255), 
    team varchar(255))`;

  await db.execute(sql);
});

class Student {
  static save(id, name) {
    let sql = `INSERT INTO students (
                    id,
                    username
                  ) VALUES(
                    ${id},
                    '${name}'
                  )`;

    return db.execute(sql);
  }

  static updatePassword(id, password) {
    let sql = `UPDATE students 
                SET password="${password}" 
                WHERE id=${id}`;

    return db.execute(sql);
  }

  static updateTeam(id, team) {
    let sql = `UPDATE students 
                SET team="${team}" 
                WHERE id=${id}`;

    return db.execute(sql);
  }

  static deleteTeam(id) {
    let sql = `UPDATE students 
                SET team=NULL 
                WHERE id=${id}`;

    return db.execute(sql);
  }

  static async findAll() {
    let sql = `SELECT id, username, team
                FROM students 
                ORDER BY team ASC`;

    const [students] = await db.execute(sql);

    return students;
  }

  static async find(username, password) {
    let sql = `SELECT * 
                FROM students 
                WHERE 
                    username='${username}' AND 
                    password='${password}'`;

    const [student] = await db.execute(sql);

    return student;
  }

  static async findById(id) {
    let sql = `SELECT * 
                FROM students 
                WHERE id=${id}`;

    const [student] = await db.execute(sql);

    return student;
  }

  static async findByTeam(team) {
    let sql = `SELECT * 
                FROM students 
                WHERE team='${team}'`;

    const [students] = await db.execute(sql);

    return students;
  }
}

module.exports = Student;
