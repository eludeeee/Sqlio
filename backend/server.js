const express = require('express');
const cors = require('cors');
const { db, hashPassword } = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// API Register
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });

    const hashed = hashPassword(password);
    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashed], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE')) {
                return res.status(400).json({ error: 'Username sudah digunakan' });
            }
            return res.status(500).json({ error: 'Terjadi kesalahan database' });
        }
        res.json({ success: true, userId: this.lastID, username });
    });
});

// API Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });

    const hashed = hashPassword(password);
    db.get(`SELECT id, username, score, cases_solved FROM users WHERE username = ? AND password = ?`, [username, hashed], (err, user) => {
        if (err) return res.status(500).json({ error: 'Terjadi kesalahan database' });
        if (!user) return res.status(401).json({ error: 'Username atau password salah' });
        
        res.json({ success: true, user });
    });
});

// API Get Profile
app.get('/api/users/:id', (req, res) => {
    const userId = req.params.id;
    db.get(`SELECT id, username, score, cases_solved FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err || !user) return res.status(404).json({ error: 'User tidak ditemukan' });
        res.json({ success: true, user });
    });
});

// API Update Score
app.post('/api/score', (req, res) => {
    const { userId, points } = req.body;
    if (!userId || !points) return res.status(400).json({ error: 'Data tidak lengkap' });

    db.run(`UPDATE users SET score = score + ?, cases_solved = cases_solved + 1 WHERE id = ?`, [points, userId], function(err) {
        if (err) return res.status(500).json({ error: 'Gagal mengupdate skor' });
        res.json({ success: true });
    });
});

// API Leaderboard
app.get('/api/leaderboard', (req, res) => {
    db.all(`SELECT id, username, score, cases_solved FROM users ORDER BY score DESC LIMIT 10`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Gagal mengambil leaderboard' });
        res.json({ success: true, leaderboard: rows });
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
