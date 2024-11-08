const db = require("../config/db");

class Bribe {
  constructor(id, amount, grade, message) {
    this.id = id;
    this.amount = amount;
    this.grade = grade;
    this.message = message;
  }

  save() {
    let sql = `INSERT INTO bribes (
                    StudentID, 
                    BribeAmount, 
                    GradeWanted, 
                    Message
                ) VALUES(
                    ${this.id},
                    ${this.amount},
                    '${this.grade}',
                    '${this.message}'
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
