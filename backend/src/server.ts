import dotenv from 'dotenv';
dotenv.config(); // Must be first – before any service imports that read process.env

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { issueRouter } from './routes/issueRoutes';
import { dashboardRouter } from './routes/dashboardRoutes';
import { logger } from './utils/logger';
import { authRouter } from './routes/authRoutes';

// ── Startup env validation ────────────────────────────────────────────────────
const REQUIRED = [
  'GROQ_API_KEY', 'E2B_API_KEY', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO',
];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length > 0) {
  logger.warn(`Missing env vars: ${missing.join(', ')}. Some features may degrade gracefully.`);
}
if (process.env.DEMO_MODE === 'true') {
  logger.info('DEMO_MODE=true – sandbox and AI coding agent will be skipped');
}

const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use(limiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/issues', issueRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api', authRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), demo: process.env.DEMO_MODE === 'true' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(
  (err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error('Unhandled error', { message: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  logger.info(`🚀 Site Surgeon backend running on http://localhost:${PORT}`);
});

export default app;
