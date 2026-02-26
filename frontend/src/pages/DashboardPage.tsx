/**
 * pages/DashboardPage.tsx
 *
 * Displays stats and a table of all issues. Auto-refreshes every 5 seconds.
 */
import { Link } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import StatCard from '../components/StatCard';

export default function DashboardPage() {
  const { issues, stats, loading, error, refresh } = useDashboard();

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <p className="text-red-400 text-sm">
          {error} – Is the backend running on port 4000?
        </p>
        <button onClick={refresh} className="btn-primary mt-4 text-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Auto-refreshes every 5 seconds</p>
        </div>
        <Link to="/" className="btn-primary text-sm">
          + Report New Issue
        </Link>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <StatCard label="Total"    value={stats.total}    accent="bg-gray-800" />
          <StatCard label="Active"   value={stats.classifying + stats.sandboxing + stats.fixing} accent="bg-blue-950" />
          <StatCard label="Merged"   value={stats.merged}   accent="bg-green-950" />
          <StatCard label="Notified" value={stats.notified} accent="bg-orange-950" />
          <StatCard label="Failed"   value={stats.failed}   accent="bg-red-950" />
          <StatCard label="PRs Open" value={stats.pr_opened} accent="bg-purple-950" />
        </div>
      )}

      {/* AI Decision breakdown */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card flex items-center gap-4">
            <div className="text-3xl font-bold text-blue-400">{stats.automated}</div>
            <div>
              <p className="text-sm font-semibold text-white">Automated Fixes</p>
              <p className="text-xs text-gray-500">AI handled end-to-end</p>
            </div>
          </div>
          <div className="card flex items-center gap-4">
            <div className="text-3xl font-bold text-orange-400">{stats.manual}</div>
            <div>
              <p className="text-sm font-semibold text-white">Manual Reviews</p>
              <p className="text-xs text-gray-500">Escalated to admin</p>
            </div>
          </div>
        </div>
      )}

      {/* Issues Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-200 text-sm">
            All Issues
            {loading && (
              <span className="ml-2 inline-block w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin align-middle" />
            )}
          </h2>
          <span className="text-xs text-gray-500">{issues.length} total</span>
        </div>

        {issues.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No issues yet.</p>
            <Link to="/" className="btn-primary mt-4 inline-block text-sm">
              Report the first issue →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">Title</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">Severity</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">AI Decision</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">PR</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-gray-400">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-3 px-3">
                      <Link
                        to={`/issues/${issue.id}`}
                        className="text-blue-400 hover:underline font-medium leading-tight"
                      >
                        {issue.title}
                      </Link>
                      <p className="text-xs text-gray-600 mt-0.5 truncate max-w-[220px]">
                        {issue.repoUrl.replace('https://github.com/', '')}
                      </p>
                    </td>
                    <td className="py-3 px-3">
                      <SeverityBadge severity={issue.severity} />
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="py-3 px-3">
                      {issue.aiDecision ? (
                        <span
                          className={`badge text-xs ${
                            issue.aiDecision === 'AUTOMATED'
                              ? 'bg-blue-900 text-blue-300'
                              : 'bg-orange-900 text-orange-300'
                          }`}
                        >
                          {issue.aiDecision === 'AUTOMATED' ? '🤖 Auto' : '👤 Manual'}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      {issue.prUrl ? (
                        <a
                          href={issue.prUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs"
                        >
                          View PR
                        </a>
                      ) : (
                        <span className="text-gray-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(issue.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
