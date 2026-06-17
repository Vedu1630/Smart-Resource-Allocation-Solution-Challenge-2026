require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const http = require('http');
const { Server } = require('socket.io');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


// Create HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PUT"] }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket Connection
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// --- AUTH ENDPOINTS ---

app.post('/api/auth/signup', async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields are required' });

    const userRole = role || 'volunteer';

    try {
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (row) return res.status(400).json({ error: 'Email already in use' });

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            db.run('INSERT INTO users (name, email, password, role, emailVerified) VALUES (?, ?, ?, ?, 1)',
                [name, email, hashedPassword, userRole],
                function(err) {
                    if (err) return res.status(500).json({ error: 'Failed to create user' });
                    const userId = this.lastID;
                    const token = jwt.sign({ id: userId, email }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });
                    res.status(201).json({ message: 'User created', token, user: { id: userId, name, email, role: userRole, emailVerified: true } });
                }
            );
        });
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET || 'fallback', { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role || 'volunteer', emailVerified: true } });
    });
});

app.get('/api/auth/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback');
        db.get('SELECT id, name, email, role, emailVerified FROM users WHERE id = ?', [decoded.id], (err, user) => {
            if (err || !user) return res.status(404).json({ error: 'User not found' });
            res.json({ user: { ...user, role: user.role || 'volunteer', emailVerified: true } });
        });
    } catch (err) { res.status(401).json({ error: 'Invalid token' }); }
});

app.get('/api/config', (req, res) => {
    res.json({
        googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || ''
    });
});

// --- OPERATIONS ENDPOINTS (REST + WebSockets) ---

// Needs
app.get('/api/needs', (req, res) => {
    db.all('SELECT * FROM needs', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(r => ({ ...r, gps: JSON.parse(r.gps || '{"lat":0,"lng":0}') }));
        res.json(parsed);
    });
});

app.post('/api/needs', (req, res) => {
    const need = req.body;
    db.run(
        'INSERT INTO needs (id, title, category, severity, zone, status, description, reportedAt, assignedTo, gps) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [need.id, need.title, need.category, need.severity, need.zone, need.status, need.description, need.reportedAt, need.assignedTo, JSON.stringify(need.gps)],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit('need_added', need); // Broadcast live update
            res.json({ message: 'Need added', need });
        }
    );
});

app.put('/api/needs/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body; // e.g. status, assignedTo
    
    // Simple update builder for demo purposes
    let query = 'UPDATE needs SET ';
    let params = [];
    Object.keys(updates).forEach((key, idx, arr) => {
        query += `${key} = ?`;
        if (idx < arr.length - 1) query += ', ';
        params.push(key === 'gps' ? JSON.stringify(updates[key]) : updates[key]);
    });
    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('need_updated', { id, ...updates }); // Broadcast live update
        res.json({ message: 'Need updated' });
    });
});

// Volunteers
app.get('/api/volunteers', (req, res) => {
    db.all('SELECT * FROM volunteers', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(r => ({
            ...r,
            gps: JSON.parse(r.gps || '{"lat":0,"lng":0}'),
            skills: JSON.parse(r.skills || '[]'),
            languages: JSON.parse(r.languages || '[]'),
            availability: JSON.parse(r.availability || '{"mon":false,"tue":false,"wed":false,"thu":false,"fri":false,"sat":false,"sun":false}'),
            matchHistory: JSON.parse(r.matchHistory || '[]'),
            hoursLogged: r.hoursLogged || 0
        }));
        res.json(parsed);
    });
});

app.post('/api/volunteers', (req, res) => {
    const v = req.body;
    db.run(
        `INSERT INTO volunteers (id, name, email, phone, skills, languages, availability, zone, status, currentZone, gps, avatar, hoursLogged, matchHistory, joinDate)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            v.id,
            v.name,
            v.email,
            v.phone,
            JSON.stringify(v.skills || []),
            JSON.stringify(v.languages || []),
            JSON.stringify(v.availability || {}),
            v.zone,
            v.status,
            v.currentZone || v.zone,
            JSON.stringify(v.gps || { lat: 0, lng: 0 }),
            v.avatar,
            v.hoursLogged || 0,
            JSON.stringify(v.matchHistory || []),
            v.joinDate
        ],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            io.emit('volunteer_added', v);
            res.json({ message: 'Volunteer added', volunteer: v });
        }
    );
});

app.put('/api/volunteers/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    let query = 'UPDATE volunteers SET ';
    let params = [];
    Object.keys(updates).forEach((key, idx, arr) => {
        query += `${key} = ?`;
        if (idx < arr.length - 1) query += ', ';
        
        let val = updates[key];
        if (key === 'gps' || key === 'skills' || key === 'languages' || key === 'availability' || key === 'matchHistory') {
            val = JSON.stringify(val);
        }
        params.push(val);
    });
    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        io.emit('volunteer_updated', { id, ...updates });
        res.json({ message: 'Volunteer updated' });
    });
});

// Zones
app.get('/api/zones', (req, res) => {
    db.all('SELECT * FROM zones', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsed = rows.map(r => ({ ...r, gps: JSON.parse(r.gps || '{"lat":0,"lng":0}') }));
        res.json(parsed);
    });
});

// --- AI ENDPOINTS ---
app.post('/api/ai/categorize', async (req, res) => {
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: 'Description is required' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key is not configured on the server.' });
    }

    try {
        const prompt = `
        You are an emergency response dispatcher AI. Categorize the following incident report.
        Categories: Medical, Food & Nutrition, Infrastructure, Water & Sanitation, Child Care, Counseling, Education, IT Support, Logistics, Translation, Other.
        Severity: 1 to 10 (10 being immediate life-threatening emergency).
        
        Incident: "${description}"
        
        Return ONLY a JSON object (no markdown, no extra text) with this exact schema:
        {"category": "Category Name", "severity": 8, "confidence": 0.95}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        // Parse the JSON out of the response string (in case Gemini wraps it in markdown code blocks)
        let responseText = response.text;
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResponse = JSON.parse(responseText);
        res.json(jsonResponse);
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'AI Categorization failed' });
    }
});

app.post('/api/ai/extract', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    try {
        const prompt = `
        You are an AI assistant parsing raw field reports from disaster zones.
        Extract a list of distinct emergency needs mentioned in the report.
        
        Raw Report: "${text}"
        
        Return ONLY a JSON object with this exact schema:
        {
          "extractedNeeds": [
            {
              "title": "Short descriptive title",
              "category": "Category Name (e.g. Medical, Infrastructure)",
              "severity": 8,
              "description": "Detailed description of the need",
              "zone": "z1"
            }
          ],
          "confidence": 0.9,
          "warnings": ["Any warnings or conflicts found, empty array if none"]
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let responseText = response.text;
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResponse = JSON.parse(responseText);
        res.json(jsonResponse);
    } catch (error) {
        console.error('Gemini Extract Error:', error);
        res.status(500).json({ error: 'AI Extraction failed' });
    }
});

let briefCache = {
    data: null,
    timestamp: 0
};

app.post('/api/ai/brief', async (req, res) => {
    const { needs, volunteers } = req.body;

    // Check cache (5 minutes TTL)
    const now = Date.now();
    if (briefCache.data && (now - briefCache.timestamp < 300000)) {
        console.log('Serving operational brief from cache');
        return res.json(briefCache.data);
    }

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'Gemini API key is not configured.' });
    }

    try {
        const prompt = `
        You are an emergency operations coordinator AI. Generate a concise operational brief based on the current state of emergency needs and active volunteers.
        
        Current Needs:
        ${JSON.stringify(needs)}
        
        Active Volunteers:
        ${JSON.stringify(volunteers)}
        
        Provide a summary of the situation, a list of priority actions, and any risk flags.
        
        Return ONLY a JSON object (no markdown, no extra text) with this exact schema:
        {
          "summary": "Concise paragraph summarizing the situation...",
          "priorities": ["Priority action 1", "Priority action 2", ...],
          "riskFlags": ["Risk flag 1", "Risk flag 2", ...]
        }
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        let responseText = response.text;
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResponse = JSON.parse(responseText);
        
        // Update cache
        briefCache = {
            data: jsonResponse,
            timestamp: now
        };

        res.json(jsonResponse);
    } catch (error) {
        console.error('Gemini Brief Error:', error);
        // If Gemini API fails (e.g. rate limit 429) but we have a cache, serve it
        if (briefCache.data) {
            console.log('Gemini error encountered, serving stale cached brief as fallback');
            return res.json(briefCache.data);
        }
        res.status(500).json({ error: 'AI Brief generation failed' });
    }
});

// Start Server Using `server.listen` instead of `app.listen` for Socket.io!
server.listen(PORT, () => {
    console.log(`Server + Socket.io running on http://localhost:${PORT}`);
});
