const Database = require("better-sqlite3");

const db = new Database("activity_logs.db");

db.prepare(`
CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    action TEXT,
    module TEXT,
    status TEXT,
    message TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

console.log("SQLite Connected");

module.exports = db;