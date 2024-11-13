const db = require("../config/db");

class Bribe {
  static save(id, amount, grade, message) {
    let sql = `INSERT INTO bribes (
                    student_id, 
                    amount, 
                    grade, 
                    message
                ) VALUES(?, ?, ?, ?)`;

    return db.execute(sql, [id, amount, grade, message]);
  }

  static async findAll() {
    let sql = `SELECT *
                FROM bribes`;

    const [bribes, _] = await db.execute(sql);

    return bribes;
  }
}

module.exports = Bribe;
