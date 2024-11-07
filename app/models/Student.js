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

  static updatePassword(password) {
    let sql = `UPDATE students 
                SET Password="${password}" 
                WHERE ID=${this.id}`;

    return db.execute(sql);
  }

  static find(username, password) {
    let sql = `SELECT * 
                FROM students 
                WHERE 
                    Username ='${username}' AND 
                    Password='${password}'`;

    return db.execute(sql);
  }
}

module.exports = Student;
