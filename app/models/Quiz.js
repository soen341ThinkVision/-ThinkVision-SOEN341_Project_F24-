const db = require("../config/db");

db.execute("DROP TABLE IF EXISTS questions").then(async () => {
  const sql = `CREATE TABLE questions (
        question varchar(255), 
        answer varchar(255))`;

  await db.execute(sql);
});

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
