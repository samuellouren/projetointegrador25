import db from "../config/database.js"

class User {
  static create(name, email, password) {
    const stmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)")
    const result = stmt.run(name, email, password)
    return result.lastInsertRowid
  }

  static findByEmail(email) {
    const stmt = db.prepare("SELECT * FROM users WHERE email = ?")
    return stmt.get(email)
  }

  static findById(id) {
    const stmt = db.prepare("SELECT * FROM users WHERE id = ?")
    return stmt.get(id)
  }

  static getAll() {
    const stmt = db.prepare("SELECT id, name, email, created_at FROM users")
    return stmt.all()
  }

  static update(id, data) {
    const fields = []
    const values = []

    if (data.name) {
      fields.push("name = ?")
      values.push(data.name)
    }
    if (data.email) {
      fields.push("email = ?")
      values.push(data.email)
    }

    if (fields.length === 0) return false

    fields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(id)

    const stmt = db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`)
    const result = stmt.run(...values)
    return result.changes > 0
  }

  static updatePassword(id, hashedPassword) {
    const stmt = db.prepare("UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    const result = stmt.run(hashedPassword, id)
    return result.changes > 0
  }

  static delete(id) {
    const stmt = db.prepare("DELETE FROM users WHERE id = ?")
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default User
