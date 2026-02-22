require('dotenv').config();
const express = require('express');
const cors = require('cors');
const reportRoutes = require('./routes/report');
const healthRoutes = require('./routes/health');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Request Logger ─────────────────────────────────────────
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api', reportRoutes);
app.use('/api', healthRoutes);

// ── Global Error Handler ───────────────────────────────────
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀  AI Self-Healing backend running on http://localhost:${PORT}`);
    console.log(`    Health check: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
