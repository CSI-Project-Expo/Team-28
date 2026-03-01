import { Router } from 'express';
import { listIssues, getStats } from '../controllers/dashboardController';
import { login } from '../controllers/authController';

export const dashboardRouter = Router();

// GET /api/dashboard/issues
dashboardRouter.get('/issues', listIssues);

// GET /api/dashboard/stats
dashboardRouter.get('/stats', getStats);

// POST /login
dashboardRouter.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await login(username, password);
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});
