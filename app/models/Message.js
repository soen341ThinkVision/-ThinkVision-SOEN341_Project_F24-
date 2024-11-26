const db = require("../config/db");

class Message {
  static save(senderId, receiverId, content) {
    const sql = `INSERT INTO messages (
                  sender_id, 
                  receiver_id, 
                  content, 
                  timestamp
                ) VALUES (?, ?, ?, NOW())`;

    return db.execute(sql, [senderId, receiverId, content]);
  }

  static async findByUser(userId, otherUserId) {
    const sql = `SELECT * 
                FROM messages 
                WHERE (sender_id=${userId} 
                  AND receiver_id=${otherUserId}) 
                  OR (sender_id=${otherUserId} 
                  AND receiver_id=${userId}) 
                ORDER BY timestamp ASC`;

    const [messages] = await db.execute(sql);

    return messages;
  }
}

module.exports = Message;
