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

  static async update(id, amount, grade, message) {
    let sql = `UPDATE bribes
                SET amount=?, grade=?, message=?, response=NULL
                WHERE student_id=?`;

    return db.execute(sql, [amount, grade, message, id]);
  }

  static async respond(id, response) {
    let sql = `UPDATE bribes
                SET response=? 
                WHERE student_id=?`;

    return db.execute(sql, [response, id]);
  }

  static async findAll() {
    let sql = `SELECT *
                FROM bribes`;

    const [bribes, _] = await db.execute(sql);

    return bribes;
  }

  static async findAllReplied() {
    let sql = `SELECT *
                FROM bribes
                WHERE response IS NOT NULL 
                  AND response <> 'closed'`;

    const [bribes, _] = await db.execute(sql);

    return bribes;
  }

  static async findById(id) {
    let sql = `SELECT *
                FROM bribes
                WHERE student_id=?`;

    const [bribes, _] = await db.execute(sql, [id]);

    return bribes;
  }
}

module.exports = Bribe;
