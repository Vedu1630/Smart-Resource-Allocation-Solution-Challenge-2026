const fs = require('fs');
const path = require('path');

const isVercel = process.env.VERCEL || process.env.NOW_BUILD_TRIGGER;

// We use impactmatch.json in /tmp for write access on Vercel, or db_seed.json locally
const dbPath = isVercel 
    ? path.join('/tmp', 'impactmatch.json') 
    : path.resolve(__dirname, 'db_seed.json');

// Ensure db file exists
const seedDbPath = path.resolve(__dirname, 'db_seed.json');

if (isVercel && !fs.existsSync(dbPath)) {
    if (fs.existsSync(seedDbPath)) {
        try {
            fs.copyFileSync(seedDbPath, dbPath);
            console.log('Successfully copied seed database JSON to /tmp');
        } catch (e) {
            console.error('Failed to copy seed database to /tmp', e);
        }
    }
}

// Load database state in memory
let dbData = {
    users: [],
    needs: [],
    volunteers: [],
    zones: []
};

function loadDb() {
    try {
        if (fs.existsSync(dbPath)) {
            const content = fs.readFileSync(dbPath, 'utf8');
            dbData = JSON.parse(content);
        } else if (fs.existsSync(seedDbPath)) {
            const content = fs.readFileSync(seedDbPath, 'utf8');
            dbData = JSON.parse(content);
        }
    } catch (e) {
        console.error('Error loading database JSON:', e);
    }
}

function saveDb() {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving database JSON:', e);
    }
}

// Initial load
loadDb();

class MockDatabase {
    serialize(fn) {
        // Run immediately
        if (typeof fn === 'function') {
            fn();
        }
    }

    get(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        
        try {
            const rows = this._query(sql, params);
            const row = rows.length > 0 ? rows[0] : null;
            if (typeof callback === 'function') {
                callback(null, row);
            }
        } catch (err) {
            if (typeof callback === 'function') {
                callback(err);
            }
        }
    }

    all(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        
        try {
            const rows = this._query(sql, params);
            if (typeof callback === 'function') {
                callback(null, rows);
            }
        } catch (err) {
            if (typeof callback === 'function') {
                callback(err);
            }
        }
    }

    run(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        
        try {
            const result = this._execute(sql, params);
            if (typeof callback === 'function') {
                // sqlite3 passes context with lastID and changes
                callback.call({ lastID: result.lastID, changes: result.changes }, null);
            }
        } catch (err) {
            if (typeof callback === 'function') {
                callback(err);
            }
        }
    }

    _query(sql, params) {
        const sqlNorm = sql.toLowerCase().replace(/\s+/g, ' ').trim();
        
        // Find table name
        const fromMatch = sqlNorm.match(/from\s+([a-zA-Z0-9_]+)/);
        if (!fromMatch) {
            return [];
        }
        
        const tableName = fromMatch[1];
        let rows = dbData[tableName] || [];
        
        // Apply filters
        if (/where\s+email\s*=\s*\?/i.test(sql)) {
            const emailVal = params[0];
            rows = rows.filter(r => r.email === emailVal);
        } else if (/where\s+id\s*=\s*\?/i.test(sql)) {
            const idVal = params[0];
            rows = rows.filter(r => r.id == idVal);
        }
        
        // Return deep copy so external modifications don't mutate DB directly
        return JSON.parse(JSON.stringify(rows));
    }

    _execute(sql, params) {
        const sqlNorm = sql.toLowerCase().replace(/\s+/g, ' ').trim();
        let lastID = undefined;
        let changes = 0;
        
        if (sqlNorm.startsWith('create table') || sqlNorm.startsWith('alter table')) {
            // Ignore schema queries
            return { lastID, changes };
        }
        
        if (sqlNorm.startsWith('insert into')) {
            const insertMatch = sqlNorm.match(/insert\s+into\s+([a-zA-Z0-9_]+)/);
            if (!insertMatch) throw new Error('Could not parse INSERT table name');
            
            const tableName = insertMatch[1];
            if (!dbData[tableName]) dbData[tableName] = [];
            
            // Extract columns
            const colsMatch = sqlNorm.match(/\(([^)]+)\)\s+values/);
            if (!colsMatch) throw new Error('Could not parse INSERT columns');
            const columns = colsMatch[1].split(',').map(c => c.trim());
            
            // Extract values clause from the original sql to preserve casing if needed,
            // but for values clause it's mostly placeholders or literals
            const valuesClauseMatch = sqlNorm.match(/values\s*\(([^)]+)\)/);
            if (!valuesClauseMatch) throw new Error('Could not parse INSERT values');
            const valuesClause = valuesClauseMatch[1].split(',').map(v => v.trim());
            
            const newRow = {};
            let paramIdx = 0;
            
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const valExpr = valuesClause[i];
                if (valExpr === '?') {
                    newRow[col] = params[paramIdx++];
                } else {
                    if (valExpr === '1') {
                        newRow[col] = 1;
                    } else if (valExpr === '0') {
                        newRow[col] = 0;
                    } else {
                        newRow[col] = valExpr.replace(/['"]/g, '');
                    }
                }
            }
            
            // Generate integer ID if users table and ID not provided
            if (tableName === 'users' && !newRow.hasOwnProperty('id')) {
                const maxId = dbData.users.reduce((max, u) => Math.max(max, u.id || 0), 0);
                newRow.id = maxId + 1;
                lastID = newRow.id;
            } else if (newRow.hasOwnProperty('id')) {
                lastID = newRow.id;
            }
            
            dbData[tableName].push(newRow);
            changes = 1;
            saveDb();
        } else if (sqlNorm.startsWith('update')) {
            const updateMatch = sqlNorm.match(/update\s+([a-zA-Z0-9_]+)/);
            if (!updateMatch) throw new Error('Could not parse UPDATE table name');
            
            const tableName = updateMatch[1];
            
            // Parse assignments from original case-sensitive SQL to preserve column casing
            const setStart = sql.search(/set/i) + 3;
            const whereStart = sql.search(/where/i);
            if (setStart === -1 || whereStart === -1) throw new Error('Could not parse UPDATE SET/WHERE clauses');
            
            const setClause = sql.substring(setStart, whereStart);
            const assignments = setClause.split(',').map(a => a.trim());
            const columnsToUpdate = assignments.map(a => a.split('=')[0].trim());
            
            const idVal = params[params.length - 1];
            
            const rowToUpdate = dbData[tableName].find(row => row.id == idVal);
            if (rowToUpdate) {
                columnsToUpdate.forEach((col, idx) => {
                    rowToUpdate[col] = params[idx];
                });
                changes = 1;
                saveDb();
            }
        }
        
        return { lastID, changes };
    }
}

const db = new MockDatabase();
console.log('Pure JS Database Engine initialized.');

module.exports = db;
