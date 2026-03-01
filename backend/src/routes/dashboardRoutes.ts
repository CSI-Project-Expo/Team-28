import { Router } from 'express';
import { listIssues, getStats } from '../controllers/dashboardController';

export const dashboardRouter = Router();

// GET /api/dashboard/issues
dashboardRouter.get('/issues', listIssues);

// GET /api/dashboard/stats
dashboardRouter.get('/stats', getStats);
