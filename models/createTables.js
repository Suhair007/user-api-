const db = require('../db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS managers (
    manager_id TEXT PRIMARY KEY,
    is_active INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    mob_num TEXT UNIQUE NOT NULL,
    pan_num TEXT UNIQUE NOT NULL,
    manager_id TEXT,
    created_at TEXT,
    updated_at TEXT,
    is_active INTEGER,
    FOREIGN KEY (manager_id) REFERENCES managers(manager_id)
  )`);

  // Insert sample manager data
  db.run(`INSERT OR IGNORE INTO managers (manager_id, is_active)
          VALUES ('manager-1', 1), ('manager-2', 1), ('manager-3', 0)`);
});
