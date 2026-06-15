const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Vercel serverless environment check: use /tmp/impactmatch.db which is writeable!
const isVercel = process.env.VERCEL || process.env.NOW_BUILD_TRIGGER;
const dbPath = isVercel 
    ? path.join('/tmp', 'impactmatch.db') 
    : path.resolve(__dirname, 'impactmatch.db');

// If on Vercel and the database file doesn't exist in /tmp, copy the seeded one from the project directory
if (isVercel && !fs.existsSync(dbPath)) {
    const seedDbPath = path.resolve(__dirname, 'impactmatch.db');
    if (fs.existsSync(seedDbPath)) {
        try {
            fs.copyFileSync(seedDbPath, dbPath);
            console.log('Successfully copied seed database to /tmp');
        } catch (e) {
            console.error('Failed to copy seed database to /tmp', e);
        }
    }
}

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create tables
        db.serialize(() => {
            // Users table (Auth)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                role TEXT DEFAULT 'volunteer',
                emailVerified BOOLEAN DEFAULT 1,
                verificationToken TEXT,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, () => {
                db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'volunteer'`, (err) => {
                    // Ignore error if column already exists
                });
            });

            // Needs table
            db.run(`CREATE TABLE IF NOT EXISTS needs (
                id TEXT PRIMARY KEY,
                title TEXT,
                category TEXT,
                severity INTEGER,
                zone TEXT,
                status TEXT,
                description TEXT,
                reportedAt TEXT,
                assignedTo TEXT,
                gps TEXT
            )`);

            // Volunteers table
            db.run(`CREATE TABLE IF NOT EXISTS volunteers (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                skills TEXT,
                languages TEXT,
                availability TEXT,
                zone TEXT,
                status TEXT,
                currentZone TEXT,
                gps TEXT,
                avatar TEXT,
                hoursLogged REAL DEFAULT 0,
                matchHistory TEXT,
                joinDate TEXT
            )`);

            // Zones table
            db.run(`CREATE TABLE IF NOT EXISTS zones (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                riskLevel TEXT,
                activeVolunteers INTEGER,
                needsCount INTEGER,
                gps TEXT
            )`);
            
            console.log('All database tables ready.');
        });
    }
});

module.exports = db;
