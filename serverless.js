const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// In-memory store for IP sessions (resets on server restart)
// For persistence across restarts, you could swap this with a file or database
const sessionStore = new Map();

// Middleware to serve static files (your game HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to parse JSON requests (if your games send data)
app.use(express.json());

// Middleware to extract client IP
app.use((req, res, next) => {
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    req.clientIp = clientIp;
    next();
});

// Endpoint to get or reset game state based on IP
app.get('/session', (req, res) => {
    const ip = req.clientIp;

    if (!sessionStore.has(ip)) {
        // New IP detected, start a fresh session
        sessionStore.set(ip, { score: 0, gameData: {} });
        console.log(`New session started for IP: ${ip}`);
    }

    const session = sessionStore.get(ip);
    res.json(session);
});

// Endpoint to update game state (e.g., score)
app.post('/session', (req, res) => {
    const ip = req.clientIp;
    const { score, gameData } = req.body;

    if (!sessionStore.has(ip)) {
        sessionStore.set(ip, { score: 0, gameData: {} });
    }

    const session = sessionStore.get(ip);
    session.score = score !== undefined ? score : session.score;
    session.gameData = gameData || session.gameData;

    res.json({ message: 'Session updated', session });
});

// Endpoint to reset session manually (optional for debugging or restart feature)
app.post('/session/reset', (req, res) => {
    const ip = req.clientIp;
    sessionStore.set(ip, { score: 0, gameData: {} });
    res.json({ message: 'Session reset', session: sessionStore.get(ip) });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
