import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Types matching the backend ────────────────────────────────────────────────
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type AiDecision = 'AUTOMATED' | 'MANUAL';
export type IssueStatus =
  | 'received'
  | 'classifying'
  | 'sandboxing'
  | 'fixing'
  | 'pr_opened'
  | 'merged'
  | 'notified'
  | 'failed';

export interface Issue {
  id: string;
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  repoUrl: string;
  status: IssueStatus;
  aiDecision?: AiDecision;
  aiReason?: string;
  sandboxId?: string;
  sandboxLogs: string[];
  branchName?: string;
  prUrl?: string;
  patchSummary?: string;
  commitMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  total: number;
  received: number;
  classifying: number;
  sandboxing: number;
  fixing: number;
  pr_opened: number;
  merged: number;
  notified: number;
  failed: number;
  automated: number;
  manual: number;
}

export interface ReportPayload {
  title: string;
  description: string;
  stepsToReproduce: string;
  severity: Severity;
  repoUrl: string;
}

// ── API calls ─────────────────────────────────────────────────────────────────
export async function reportIssue(payload: ReportPayload): Promise<{ issueId: string; status: string }> {
  try {
    const { data } = await api.post('/issues/report', payload);
    return data;
  } catch (error) {
    console.error('Error reporting issue:', error);
    throw error;
  }
}

export async function fetchIssue(id: string): Promise<Issue> {
  try {
    const { data } = await api.get<Issue>(`/issues/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching issue:', error);
    throw error;
  }
}

export async function fetchAllIssues(): Promise<Issue[]> {
  try {
    const { data } = await api.get<{ issues: Issue[] }>('/dashboard/issues');
    return data.issues;
  } catch (error) {
    console.error('Error fetching all issues:', error);
    throw error;
  }
}

export async function fetchStats(): Promise<DashboardStats> {
  try {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    throw error;
  }
}
