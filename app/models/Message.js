const db = require("../config/db");

class Message {
  static save(senderId, receiverId, content) {
    let sql = `INSERT INTO messages (sender_id, receiver_id, content, timestamp) VALUES (${senderId}, ${receiverId}, '${content}', NOW())`;
    return db.execute(sql);
  }

  static async findByUser(userId) {
    let sql = `SELECT * FROM messages WHERE sender_id=${userId} OR receiver_id=${userId} ORDER BY timestamp ASC`;
    const [messages, _] = await db.execute(sql);
    return messages;
  }
}

module.exports = Message;
