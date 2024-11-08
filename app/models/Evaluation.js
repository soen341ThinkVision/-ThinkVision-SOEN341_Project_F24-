const db = require("../config/db");

class Evaluation {
  //   constructor(id, name) {
  //     this.id = id;
  //     this.username = name;
  //   }
  //   save() {
  //     let sql = `INSERT INTO students (
  //                     ID,
  //                     Username
  //                   ) VALUES(
  //                     ${this.id},
  //                     '${this.username}'
  //                   )`;
  //     return db.execute(sql);
  //   }
  //   static updatePassword(password, id) {
  //     let sql = `UPDATE students
  //                 SET Password="${password}"
  //                 WHERE ID=${id}`;
  //     return db.execute(sql);
  //   }
  //   static async findById(id) {
  //     let sql = `SELECT *
  //                 FROM students
  //                 WHERE ID=${id}`;
  //     const [student, _] = await db.execute(sql);
  //     return student;
  //   }
}

module.exports = Evaluation;
