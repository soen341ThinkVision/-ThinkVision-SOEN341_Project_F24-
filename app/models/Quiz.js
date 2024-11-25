const db = require("../config/db");

class Quiz {
  static save(Question, Answer) {
    const sql = `INSERT INTO questions (
                    question,
                    answer
                ) VALUES(?, ?)`;

    return db.execute(sql, [Question, Answer]);
  }

  static async findRandomQuestion() {
    const sql = `SELECT *
                FROM questions
                ORDER BY RAND()
                LIMIT 1`;

    const [question] = await db.execute(sql);
    console.log("Question fetched: ", question);
    return question[0];
  }

  static async findByQuestionName(q) {
    const sql = `SELECT * FROM questions WHERE question=?`;

    const [question] = await db.execute(sql, [q]);

    return question[0];
  }
}

module.exports = Quiz;
