/**
 * hooks/useIssue.ts
 *
 * Polls the backend every 3 seconds until the issue reaches a terminal status.
 */
import { useState, useEffect, useRef } from 'react';
import { fetchIssue, Issue, IssueStatus } from '../api/client';

const TERMINAL_STATUSES: IssueStatus[] = ['merged', 'notified', 'failed'];
const POLL_INTERVAL = 3000;

export function useIssue(id: string | undefined) {
  const [issue, setIssue] = useState<Issue | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!id) return;

    async function poll() {
      try {
        setLoading(true);
        const data = await fetchIssue(id!);
        setIssue(data);
        setError(null);

        if (!TERMINAL_STATUSES.includes(data.status)) {
          timerRef.current = setTimeout(poll, POLL_INTERVAL);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch issue');
      } finally {
        setLoading(false);
      }
    }

    poll();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [id]);

  return { issue, loading, error };
}
