import { Router } from 'express';
import { createIssue, getIssue } from '../controllers/issueController';

export const issueRouter = Router();

// POST /api/issues/report
issueRouter.post('/report', createIssue);

// GET /api/issues/:id
issueRouter.get('/:id', getIssue);
