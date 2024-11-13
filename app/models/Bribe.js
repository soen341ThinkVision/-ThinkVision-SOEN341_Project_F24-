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

  static async respond(id, response) {
    let sql = `UPDATE bribes
                SET response=? 
                WHERE student_id=?`;

    return db.execute(sql, [response, id]);
  }

  static async findAcceptedById(id) {
    let sql = `SELECT *
                FROM bribes
                WHERE student_id=? 
                  AND response='accepted'`;

    const [acceptedBribes, _] = await db.execute(sql);

    return acceptedBribes;
  }

  static async findAllAccepted() {
    let sql = `SELECT *
                FROM bribes
                WHERE response='accepted'`;

    const [acceptedBribes, _] = await db.execute(sql);

    return acceptedBribes;
  }
}

module.exports = Bribe;
