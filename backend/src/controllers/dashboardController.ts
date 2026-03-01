import { Request, Response } from 'express';
import { Issue } from '../models/Issue';

export async function listIssues(req: Request, res: Response) {
  try {
    const issues = await Issue.find();
    res.json(issues);
  } catch (error) {
    console.error('Error listing issues:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getStats(req: Request, res: Response) {
  try {
    const stats = await Issue.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          received: { $sum: { $cond: [{ $eq: ['$status', 'received'] }, 1, 0] } },
          classifying: { $sum: { $cond: [{ $eq: ['$status', 'classifying'] }, 1, 0] } },
          sandboxing: { $sum: { $cond: [{ $eq: ['$status', 'sandboxing'] }, 1, 0] } },
          fixing: { $sum: { $cond: [{ $eq: ['$status', 'fixing'] }, 1, 0] } },
          pr_opened: { $sum: { $cond: [{ $eq: ['$status', 'pr_opened'] }, 1, 0] } },
          merged: { $sum: { $cond: [{ $eq: ['$status', 'merged'] }, 1, 0] } },
          notified: { $sum: { $cond: [{ $eq: ['$status', 'notified'] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        },
      },
    ]);
    res.json(stats[0]);
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}