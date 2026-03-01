import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { processIssue } from '../services/issueProcessor';
import { issueStore } from '../utils/store';
import { logger } from '../utils/logger';

/**
 * POST /api/issues/report
 * Accepts a bug report and kicks off the AI pipeline asynchronously.
 */
export async function reportIssue(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ errors: errors.array() });
    return;
  }

  try {
    const issue = await processIssue(req.body);
    res.status(201).json({
      message: 'Issue received. AI pipeline started.',
      issueId: issue.id,
      status: issue.status,
    });
  } catch (err) {
    logger.error('reportIssue error', { error: err });
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * GET /api/issues/:id
 * Returns the current state of an issue (for polling).
 */
export function getIssue(req: Request, res: Response): void {
  const issue = issueStore.findById(req.params.id);
  if (!issue) {
    res.status(404).json({ error: 'Issue not found' });
    return;
  }
  res.json(issue);
}
