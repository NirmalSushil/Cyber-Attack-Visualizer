const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

// Create or open SQLite database
const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('✅ Connected to SQLite database at:', dbPath);
        db.run('PRAGMA foreign_keys = ON');
    }
});

// Initialize database schema
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS attacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifier TEXT,
            type TEXT,
            status TEXT,
            severityScore REAL DEFAULT 0,
            source TEXT,
            scanDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

// Wrapper for promise-based query execution
const execute = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        if (sql.trim().toUpperCase().startsWith('SELECT')) {
            db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve([rows || []]);
            });
        } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve([{ insertId: this.lastID }]);
            });
        } else {
            db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve([{ changes: this.changes }]);
            });
        }
    });
};

const pool = {
    execute,
    getConnection: async () => ({ release: () => {} })
};

module.exports = pool;
