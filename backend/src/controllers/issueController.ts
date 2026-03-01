import { Request, Response } from 'express';
import { Issue } from '../models/Issue';

export async function createIssue(req: Request, res: Response) {
  try {
    const issue = new Issue(req.body);
    await issue.save();
    res.status(201).json({ issueId: issue._id, status: 'created' });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getIssue(req: Request, res: Response) {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }
    res.json(issue);
  } catch (error) {
    console.error('Error getting issue:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getAllIssues(req: Request, res: Response) {
  try {
    const issues = await Issue.find();
    res.json(issues);
  } catch (error) {
    console.error('Error getting all issues:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}