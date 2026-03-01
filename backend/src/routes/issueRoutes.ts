import { Router } from 'express';
import { createIssue, getIssue, getAllIssues } from '../controllers/issueController';

export const issueRouter = Router();

// POST /api/issues/report
issueRouter.post('/report', createIssue);

// GET /api/issues/:id
issueRouter.get('/:id', getIssue);

// GET /api/issues
issueRouter.get('/', getAllIssues);
