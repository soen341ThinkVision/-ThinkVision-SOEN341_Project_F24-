const db = require("../config/db");

class Message {
  static save(senderId, receiverId, content) {
    let sql = `INSERT INTO messages (sender_id, receiver_id, content, timestamp) VALUES (${senderId}, ${receiverId}, '${content}', NOW())`;
    return db.execute(sql);
  }

  static async findByUser(userId, otherUserId) {
    let sql = `SELECT * FROM messages WHERE (sender_id=${userId} AND receiver_id=${otherUserId}) OR (sender_id=${otherUserId} AND receiver_id=${userId}) ORDER BY timestamp ASC`;
    const [messages, _] = await db.execute(sql);
    return messages;
  }
}

module.exports = Message;