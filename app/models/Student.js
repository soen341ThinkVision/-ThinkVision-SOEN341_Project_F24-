const db = require("../config/db");

class Student {
  constructor(id, name) {
    this.id = id;
    this.username = name;
  }

  save() {
    let sql = `INSERT INTO students (
                    ID,
                    Username
                  ) VALUES(
                    ${this.id},
                    '${this.username}'
                  )`;

    return db.execute(sql);
  }

  static updatePassword(id, password) {
    let sql = `UPDATE students 
                SET Password="${password}" 
                WHERE ID=${id}`;

    return db.execute(sql);
  }

  static updateTeam(id, team) {
    let sql = `UPDATE students 
                SET Team="${team}" 
                WHERE ID=${id}`;

    return db.execute(sql);
  }

  static deleteTeam(id) {
    let sql = `UPDATE students 
                SET Team=NULL 
                WHERE ID=${id}`;

    return db.execute(sql);
  }

  static async findAll() {
    let sql = `SELECT ID, Username, Team
                FROM students 
                ORDER BY Team ASC`;

    const [students, _] = await db.execute(sql);

    return students;
  }

  static async find(username, password) {
    let sql = `SELECT * 
                FROM students 
                WHERE 
                    Username='${username}' AND 
                    Password='${password}'`;

    const [student, _] = await db.execute(sql);

    return student;
  }

  static async findById(id) {
    let sql = `SELECT * 
                FROM students 
                WHERE ID=${id}`;

    const [student, _] = await db.execute(sql);

    return student;
  }

  static async findByTeam(team) {
    let sql = `SELECT * 
                FROM students 
                WHERE Team=${team}`;

    const [students, _] = await db.execute(sql);

    return students;
  }
  
}

module.exports = Student;
