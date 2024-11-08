const db = require("../config/db");

class Bribe {
  static save(id, amount, grade, message) {
    let sql = `INSERT INTO bribes (
                    student_id, 
                    amount, 
                    grade, 
                    message
                ) VALUES(
                    ${id},
                    ${amount},
                    '${grade}',
                    '${message}'
                )`;
    return db.execute(sql);
  }

  static async findAll() {
    let sql = `SELECT *
                FROM bribes`;

    const [bribes, _] = await db.execute(sql);

    return bribes;
  }
}

module.exports = Bribe;
