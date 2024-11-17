const db = require("../config/db");

class Quiz {
  static save(Question, Answer) {
    let sql = `INSERT INTO questions (
                    question,
                    answer
                ) VALUES(?, ?)`;

    return db.execute(sql, [Question, Answer]);
  }


  static async findRandomQuestion() {
    let sql = `SELECT *
                FROM questions
                ORDER BY RAND()
                LIMIT 1`;

    const [question, _] = await db.execute(sql);
    console.log("Question fetched: ", question);
    return question[0];
  }

  static async findByQuestionName(question) {
    let sql = `SELECT * FROM questions WHERE question ='${question}'`

    const [TheQuestion, _] = await db.execute(sql);

    return TheQuestion[0];
  }
}

module.exports = Quiz;
