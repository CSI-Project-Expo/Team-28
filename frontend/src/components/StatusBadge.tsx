/**
 * components/StatusBadge.tsx
 *
 * Colour-coded badge for issue statuses.
 */
import { IssueStatus } from '../api/client';

const STATUS_CONFIG: Record<IssueStatus, { label: string; className: string }> = {
  received:    { label: 'Received',    className: 'bg-gray-700 text-gray-200' },
  classifying: { label: 'Classifying', className: 'bg-yellow-900 text-yellow-200 animate-pulse' },
  sandboxing:  { label: 'Sandboxing',  className: 'bg-cyan-900 text-cyan-200 animate-pulse' },
  fixing:      { label: 'Fixing',      className: 'bg-blue-900 text-blue-200 animate-pulse' },
  pr_opened:   { label: 'PR Opened',   className: 'bg-purple-900 text-purple-200' },
  merged:      { label: 'Merged ✓',    className: 'bg-green-900 text-green-200' },
  notified:    { label: 'Notified',    className: 'bg-orange-900 text-orange-200' },
  failed:      { label: 'Failed',      className: 'bg-red-900 text-red-300' },
};

interface Props {
  status: IssueStatus;
}

export default function StatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-700 text-gray-200' };
  return (
    <span className={`badge ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
