/**
 * components/SeverityBadge.tsx
 */
import { Severity } from '../api/client';

const SEV_CONFIG: Record<Severity, { label: string; className: string }> = {
  critical: { label: '🔴 Critical', className: 'bg-red-900 text-red-200' },
  high:     { label: '🟠 High',     className: 'bg-orange-900 text-orange-200' },
  medium:   { label: '🟡 Medium',   className: 'bg-yellow-900 text-yellow-200' },
  low:      { label: '🟢 Low',      className: 'bg-green-900 text-green-200' },
};

interface Props {
  severity: Severity;
}

export default function SeverityBadge({ severity }: Props) {
  const cfg = SEV_CONFIG[severity];
  return <span className={`badge ${cfg.className}`}>{cfg.label}</span>;
}
