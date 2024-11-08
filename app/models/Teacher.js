const db = require("../config/db");

class Teacher {
  constructor(id, name, password) {
    this.id = id;
    this.username = name;
    this.password = password;
  }

  save() {
    let sql = `INSERT INTO teachers (
                  ID,
                  Username,
                  Password
                ) VALUES(
                  ${this.id},
                  '${this.username}', 
                  '${this.password}'
                )`;

    return db.execute(sql);
  }

  static async find(username, password) {
    let sql = `SELECT * 
                FROM teachers 
                WHERE 
                    Username='${username}' AND 
                    Password='${password}'`;

    const [teacher, _] = await db.execute(sql);

    return teacher;
  }
}

module.exports = Teacher;
