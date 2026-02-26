/**
 * hooks/useDashboard.ts
 *
 * Fetches + auto-refreshes dashboard data every 5 seconds.
 */
import { useState, useEffect, useCallback } from 'react';
import { fetchAllIssues, fetchStats, Issue, DashboardStats } from '../api/client';

export function useDashboard() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [issueData, statsData] = await Promise.all([fetchAllIssues(), fetchStats()]);
      setIssues(issueData);
      setStats(statsData);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { issues, stats, loading, error, refresh };
}
