/**
 * controllers/dashboardController.ts
 *
 * Provides aggregated data for the frontend dashboard.
 */
import { Request, Response } from 'express';
import { issueStore } from '../utils/store';

/**
 * GET /api/dashboard/issues
 * Returns all issues, newest first.
 */
export function listIssues(_req: Request, res: Response): void {
  const issues = issueStore.listAll();
  res.json({ total: issues.length, issues });
}

/**
 * GET /api/dashboard/stats
 * Returns summary counts.
 */
export function getStats(_req: Request, res: Response): void {
  const issues = issueStore.listAll();

  const stats = {
    total: issues.length,
    received: 0,
    classifying: 0,
    sandboxing: 0,
    fixing: 0,
    pr_opened: 0,
    merged: 0,
    notified: 0,
    failed: 0,
    automated: 0,
    manual: 0,
  };

  for (const issue of issues) {
    stats[issue.status as keyof typeof stats] =
      ((stats[issue.status as keyof typeof stats] as number) || 0) + 1;
    if (issue.aiDecision === 'AUTOMATED') stats.automated++;
    if (issue.aiDecision === 'MANUAL') stats.manual++;
  }

  res.json(stats);
}
