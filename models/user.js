const db = require('../db');
const bcrypt = require('bcrypt');
const { NotFoundError } = require('../expressError');

/** User of the site. */
class User {

  /** Register new user. Returns user info:
   *  { username, password, first_name, last_name, phone }
   */
  static async register({ username, password, first_name, last_name, phone }) {
    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
       VALUES ($1, $2, $3, $4, $5, current_timestamp, current_timestamp)
       RETURNING username, first_name, last_name, phone`,
      [username, hashedPassword, first_name, last_name, phone]
    );
    return result.rows[0];
  }

  /** Authenticate user with username, password. Returns boolean. */
  static async authenticate(username, password) {
    const result = await db.query(
      `SELECT password
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (user) {
      return await bcrypt.compare(password, user.password);
    }
    return false;
  }

  /** Update last_login_at for user. */
  static async updateLoginTimestamp(username) {
    const result = await db.query(
      `UPDATE users
       SET last_login_at = current_timestamp
       WHERE username = $1
       RETURNING username`,
      [username]
    );
    if (!result.rows[0]) throw new NotFoundError(`User ${username} not found`);
  }

  /** Get basic info on all users:
   *  [{ username, first_name, last_name, phone }, ...]
   */
  static async all() {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone
       FROM users`
    );
    return result.rows;
  }

  /** Get user by username.
   *  Returns { username, first_name, last_name, phone, join_at, last_login_at }
   */
  static async get(username) {
    const result = await db.query(
      `SELECT username, first_name, last_name, phone, join_at, last_login_at
       FROM users
       WHERE username = $1`,
      [username]
    );
    const user = result.rows[0];
    if (!user) throw new NotFoundError(`User ${username} not found`);
    return user;
  }

  /** Get messages sent by user.
   *  Returns [{ id, to_user, body, sent_at, read_at }]
   *  where to_user is { username, first_name, last_name, phone }
   */
  static async messagesFrom(username) {
    const result = await db.query(
      `SELECT m.id, m.to_username AS to_user, m.body, m.sent_at, m.read_at,
              u.first_name AS to_first_name, u.last_name AS to_last_name, u.phone AS to_phone
       FROM messages AS m
       JOIN users AS u ON m.to_username = u.username
       WHERE m.from_username = $1`,
      [username]
    );
    return result.rows.map(row => ({
      id: row.id,
      to_user: {
        username: row.to_user,
        first_name: row.to_first_name,
        last_name: row.to_last_name,
        phone: row.to_phone
      },
      body: row.body,
      sent_at: row.sent_at,
      read_at: row.read_at
    }));
  }

  /** Get messages received by user.
   *  Returns [{ id, from_user, body, sent_at, read_at }]
   *  where from_user is { username, first_name, last_name, phone }
   */
  static async messagesTo(username) {
    const result = await db.query(
      `SELECT m.id, m.from_username AS from_user, m.body, m.sent_at, m.read_at,
              u.first_name AS from_first_name, u.last_name AS from_last_name, u.phone AS from_phone
       FROM messages AS m
       JOIN users AS u ON m.from_username = u.username
       WHERE m.to_username = $1`,
      [username]
    );
    return result.rows.map(row => ({
      id: row.id,
      from_user: {
        username: row.from_user,
        first_name: row.from_first_name,
        last_name: row.from_last_name,
        phone: row.from_phone
      },
      body: row.body,
      sent_at: row.sent_at,
      read_at: row.read_at
    }));
  }
}

module.exports = User;
