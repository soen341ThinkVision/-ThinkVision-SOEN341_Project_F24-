const db = require("../config/db");

class Teacher {
  static save(id, name, password) {
    let sql = `INSERT INTO teachers (
                  id,
                  username,
                  password
                ) VALUES(
                  ${id},
                  '${name}', 
                  '${password}'
                )`;

    return db.execute(sql);
  }

  static async find(username, password) {
    let sql = `SELECT * 
                FROM teachers 
                WHERE 
                    username='${username}' AND 
                    password='${password}'`;

    const [teacher] = await db.execute(sql);

    return teacher;
  }

  static async findAll() {
    let sql = `SELECT * FROM teachers`;

    const [teachers] = await db.execute(sql);

    return teachers;
  }
}

module.exports = Teacher;
