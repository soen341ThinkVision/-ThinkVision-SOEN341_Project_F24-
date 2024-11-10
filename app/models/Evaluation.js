const db = require("../config/db");

class Evaluation {
  static save(reviewer, reviewee, category, score, comment) {
    let sql = `INSERT INTO evaluations (
                    reviewer_id,
                    reviewee_id, 
                    category, 
                    score, 
                    comment     
                ) VALUES(
                    ${reviewer},
                    ${reviewee},
                    '${category}',
                    ${score},
                    '${comment}'
                )`;
    return db.execute(sql);
  }

  static async getSummary() {
    let sql = `SELECT 
                    s.id,
                    s.username,
                    s.team,
                    COUNT(e.id) AS EvalCount,
                    AVG(IF(e.category = 'Cooperation', e.score, NULL)) AS AvgCoop,
                    AVG(IF(e.category = 'WorkEthic', e.score, NULL)) AS AvgEthics,
                    AVG(IF(e.category = 'ConceptualContribution', e.score, NULL)) AS AvgConceptual,
                    AVG(IF(e.category = 'PracticalContribution', e.score, NULL)) AS AvgPractical,
                    AVG(e.score) AS TotalAvg
                FROM students s LEFT JOIN 
                    evaluations e 
                    ON s.id = e.reviewee_id
                GROUP BY 
                    s.id, s.username
                ORDER BY 
                    s.id ASC`;

    const [evaluations, _] = await db.execute(sql);
    return evaluations;
  }

  static async getDetailed() {
    let sql = `SELECT 
                    s.id,
                    s.username,
                    s.team,
                    r.id AS Reviewer,
                    AVG(IF(e.category = 'Cooperation', e.score, NULL)) AS AvgCoop,
                    AVG(IF(e.category = 'WorkEthic', e.score, NULL)) AS AvgEthics,
                    AVG(IF(e.category = 'ConceptualContribution', e.score, NULL)) AS AvgConceptual,
                    AVG(IF(e.category = 'PracticalContribution', e.score, NULL)) AS AvgPractical,
                    AVG(e.score) AS TotalAvg,
                    GROUP_CONCAT(CONCAT(r.username, ': ', e.comment) SEPARATOR '; ') AS Comments
                FROM 
                    students s 
                    LEFT JOIN evaluations e 
                        ON s.ID = e.reviewee_id
                    LEFT JOIN students r 
                        ON e.reviewer_id = r.id
                GROUP BY 
                    s.id, 
                    s.username, 
                    s.team
                ORDER BY 
                    s.team ASC, 
                    s.id ASC`;

    const [evaluations, _] = await db.execute(sql);
    return evaluations;
  }

  static async find(reviewer, reviewee) {
    let sql = `SELECT category, score, comment
                FROM evaluations
                WHERE 
                    reviewee_id=${reviewee} AND 
                    reviewer_id=${reviewer}`;

    const [evaluations, _] = await db.execute(sql);
    return evaluations;
  }
}

module.exports = Evaluation;
