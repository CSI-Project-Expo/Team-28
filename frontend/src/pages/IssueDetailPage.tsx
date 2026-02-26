/**
 * pages/IssueDetailPage.tsx
 *
 * Displays real-time status of a single issue.
 * Polls every 3 seconds via useIssue() until the issue reaches a terminal state.
 */
import { useParams, Link } from 'react-router-dom';
import { useIssue } from '../hooks/useIssue';
import StatusBadge from '../components/StatusBadge';
import SeverityBadge from '../components/SeverityBadge';
import LogViewer from '../components/LogViewer';

const STEP_ORDER = [
  'received',
  'classifying',
  'sandboxing',
  'fixing',
  'pr_opened',
  'merged',
  'notified',
  'failed',
] as const;

export default function IssueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { issue, loading, error } = useIssue(id);

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-red-400 text-sm">Error: {error}</p>
        <Link to="/" className="text-blue-400 text-sm mt-2 block">← Back to report</Link>
      </div>
    );
  }

  if (loading && !issue) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading issue...</p>
        </div>
      </div>
    );
  }

  if (!issue) return null;

  const currentStepIndex = STEP_ORDER.indexOf(issue.status as typeof STEP_ORDER[number]);
  const terminalOk = issue.status === 'merged' || issue.status === 'notified';
  const terminalFail = issue.status === 'failed';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link to="/dashboard" className="text-blue-400 text-xs hover:underline">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white mt-1">{issue.title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">ID: {issue.id}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <SeverityBadge severity={issue.severity} />
          <StatusBadge status={issue.status} />
          {issue.aiDecision && (
            <span
              className={`badge ${
                issue.aiDecision === 'AUTOMATED'
                  ? 'bg-blue-900 text-blue-200'
                  : 'bg-orange-900 text-orange-200'
              }`}
            >
              {issue.aiDecision === 'AUTOMATED' ? '🤖 Automated' : '👤 Manual'}
            </span>
          )}
        </div>
      </div>

      {/* Progress Stepper */}
      {!terminalFail && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Pipeline Progress</h2>
          <div className="flex items-center gap-0 overflow-x-auto pb-2">
            {(['received', 'classifying', 'sandboxing', 'fixing', 'pr_opened', 'merged'] as const).map(
              (step, idx) => {
                const stepIdx = STEP_ORDER.indexOf(step);
                const done = currentStepIndex > stepIdx;
                const active = currentStepIndex === stepIdx;
                const isLast = idx === 5;

                return (
                  <div key={step} className="flex items-center">
                    <div className="flex flex-col items-center min-w-[72px]">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                          ${done ? 'bg-green-600 text-white' : active ? 'bg-blue-600 text-white animate-pulse' : 'bg-gray-700 text-gray-500'}`}
                      >
                        {done ? '✓' : idx + 1}
                      </div>
                      <span className={`text-xs mt-1 capitalize ${active ? 'text-blue-400' : done ? 'text-green-400' : 'text-gray-600'}`}>
                        {step.replace('_', ' ')}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`h-0.5 w-6 mx-1 mb-4 ${done ? 'bg-green-600' : 'bg-gray-700'}`} />
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Terminal – success */}
      {terminalOk && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-5">
          {issue.status === 'merged' ? (
            <>
              <p className="text-green-300 font-semibold text-sm mb-1">✅ Fix merged automatically</p>
              <p className="text-green-400 text-xs">The AI successfully fixed the bug and merged the PR.</p>
              {issue.prUrl && (
                <a
                  href={issue.prUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-3 text-sm text-blue-400 hover:underline"
                >
                  View merged PR →
                </a>
              )}
            </>
          ) : (
            <>
              <p className="text-orange-300 font-semibold text-sm mb-1">📧 Admin notified</p>
              <p className="text-orange-400 text-xs">
                The AI classified this issue as requiring manual review. An email has been sent.
              </p>
            </>
          )}
        </div>
      )}

      {/* Terminal – fail */}
      {terminalFail && (
        <div className="bg-red-900/30 border border-red-700 rounded-xl p-5">
          <p className="text-red-300 font-semibold text-sm mb-1">❌ Pipeline failed</p>
          <p className="text-red-400 text-xs">An unexpected error occurred. Check backend logs for details.</p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Issue Details</h3>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-gray-500">Repository: </span>
              <a href={issue.repoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
                {issue.repoUrl}
              </a>
            </div>
            <div>
              <span className="text-gray-500">Reported: </span>
              <span className="text-gray-300">{new Date(issue.createdAt).toLocaleString()}</span>
            </div>
            {issue.branchName && (
              <div>
                <span className="text-gray-500">Branch: </span>
                <code className="text-xs text-cyan-400">{issue.branchName}</code>
              </div>
            )}
            {issue.commitMessage && (
              <div>
                <span className="text-gray-500">Commit: </span>
                <span className="text-gray-300 text-xs">{issue.commitMessage}</span>
              </div>
            )}
            {issue.prUrl && (
              <div>
                <span className="text-gray-500">PR: </span>
                <a href={issue.prUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                  View Pull Request
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Analysis</h3>
          {issue.aiDecision ? (
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">Decision: </span>
                <span className={issue.aiDecision === 'AUTOMATED' ? 'text-blue-400' : 'text-orange-400'}>
                  {issue.aiDecision}
                </span>
              </div>
              {issue.aiReason && (
                <div>
                  <span className="text-gray-500">Reason:</span>
                  <p className="text-gray-300 text-xs mt-1 leading-relaxed">{issue.aiReason}</p>
                </div>
              )}
              {issue.sandboxId && (
                <div>
                  <span className="text-gray-500">Sandbox ID: </span>
                  <code className="text-xs text-cyan-400">{issue.sandboxId}</code>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Awaiting classification...</p>
          )}
        </div>
      </div>

      {/* Description + Steps */}
      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Description</h3>
        <p className="text-gray-300 text-sm whitespace-pre-wrap">{issue.description}</p>
      </div>

      <div className="card">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Steps to Reproduce</h3>
        <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono bg-gray-950 rounded-lg p-3">
          {issue.stepsToReproduce}
        </pre>
      </div>

      {/* Patch summary */}
      {issue.patchSummary && (
        <div className="card">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Patch Summary</h3>
          <pre className="text-xs text-green-300 font-mono bg-gray-950 rounded-lg p-3 overflow-x-auto max-h-64 overflow-y-auto">
            {issue.patchSummary}
          </pre>
        </div>
      )}

      {/* Logs */}
      <LogViewer logs={issue.sandboxLogs} title="Sandbox & Agent Logs" />
    </div>
  );
}
