const db = require("../config/db");

class Evaluation {
  constructor(reviewerID, revieweeID, TypeOfEval, score, comments) {
    this.reviewerID = reviewerID;
    this.revieweeID = revieweeID;
    this.TypeOfEval = TypeOfEval;
    this.score = score;
    this.comments = comments;
  }

  save() {
    let sql = `INSERT INTO evaluations (
                    teammateID, 
                    TypeOfEval, 
                    score, 
                    comments, 
                    reviewerID
                ) VALUES(
                    ${this.revieweeID},
                    '${this.TypeOfEval}',
                    ${this.score},
                    '${this.comments}',
                    ${this.reviewerID}
                )`;
    return db.execute(sql);
  }

  static async getSummary() {
    let sql = `SELECT 
                    s.ID,
                    s.Username,
                    s.Team,
                    COUNT(e.ID) AS EvalCount,
                    AVG(IF(e.TypeOfEval = 'Cooperation', e.score, NULL)) AS AvgCoop,
                    AVG(IF(e.TypeOfEval = 'WorkEthic', e.score, NULL)) AS AvgEthics,
                    AVG(IF(e.TypeOfEval = 'ConceptualContribution', e.score, NULL)) AS AvgConceptual,
                    AVG(IF(e.TypeOfEval = 'PracticalContribution', e.score, NULL)) AS AvgPractical,
                    AVG(e.score) AS TotalAvg
                FROM Students s LEFT JOIN 
                    Evaluations e 
                    ON s.ID = e.teammateID
                GROUP BY 
                    s.ID, s.Username
                ORDER BY 
                    s.ID ASC`;

    const [evaluations, _] = await db.execute(sql);
    return evaluations;
  }

  static async getDetailed() {
    let sql = `SELECT 
                    s.ID,
                    s.Username,
                    s.Team,
                    AVG(IF(e.TypeOfEval = 'Cooperation', e.score, NULL)) AS AvgCoop,
                    AVG(IF(e.TypeOfEval = 'WorkEthic', e.score, NULL)) AS AvgEthics,
                    AVG(IF(e.TypeOfEval = 'ConceptualContribution', e.score, NULL)) AS AvgConceptualContribution,
                    AVG(IF(e.TypeOfEval = 'PracticalContribution', e.score, NULL)) AS AvgPracticalContribution,
                    AVG(e.score) AS TotalAvg,
                    GROUP_CONCAT(CONCAT(r.Username, ': ', e.comments) SEPARATOR '; ') AS comments
                FROM 
                    Students s 
                    LEFT JOIN Evaluations e 
                        ON s.ID = e.teammateID
                    LEFT JOIN Students r 
                        ON e.reviewerID = r.ID
                GROUP BY 
                    s.ID, 
                    s.Username, 
                    s.Team
                ORDER BY 
                    s.Team ASC, 
                    s.ID ASC`;

    const [evaluations, _] = await db.execute(sql);
    return evaluations;
  }

  static async find(reviewerID, revieweeID) {
    let sql = `SELECT TypeOfEval, score, comments
                FROM evaluations
                WHERE 
                    teammateID=${revieweeID} AND 
                    reviewerID=${reviewerID}`;

    const [evaluations, _] = await db.execute(sql);
    return evaluations;
  }
}

module.exports = Evaluation;
