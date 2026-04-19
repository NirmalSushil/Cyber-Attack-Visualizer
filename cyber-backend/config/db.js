const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const dbPath = process.env.DB_PATH || path.join(__dirname, '../database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database at:', dbPath);
        db.run('PRAGMA foreign_keys = ON');
    }
});

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS attacks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            identifier TEXT,
            type TEXT,
            status TEXT,
            severityScore REAL DEFAULT 0,
            source TEXT,
            breachName TEXT,
            breachDate TEXT,
            compromisedData TEXT,
            scanDate DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    const requiredColumns = [
        ['breachName', 'TEXT'],
        ['breachDate', 'TEXT'],
        ['compromisedData', 'TEXT']
    ];

    // Lightweight migration for existing databases created with older schema.
    db.all('PRAGMA table_info(attacks)', (pragmaErr, columns) => {
        if (pragmaErr) {
            console.error('Failed to inspect attacks schema:', pragmaErr.message);
            return;
        }

        const existing = new Set((columns || []).map((col) => col.name));
        requiredColumns.forEach(([name, type]) => {
            if (!existing.has(name)) {
                db.run(`ALTER TABLE attacks ADD COLUMN ${name} ${type}`);
            }
        });
    });

    db.run(`
        CREATE TABLE IF NOT EXISTS threat_cache (
            ip TEXT PRIMARY KEY,
            confidenceScore INTEGER,
            isp TEXT,
            vtStats TEXT, 
            cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            phone TEXT,
            govId TEXT UNIQUE,
            passwordHash TEXT NOT NULL,
            role TEXT DEFAULT 'Analyst',
            department TEXT DEFAULT 'Cyber Security',
            clearance TEXT DEFAULT 'STANDARD',
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
});

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
