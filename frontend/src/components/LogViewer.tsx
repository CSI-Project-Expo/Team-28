/**
 * components/LogViewer.tsx
 *
 * Scrollable, monospace log viewer for sandbox and agent logs.
 */
interface Props {
  logs: string[];
  title?: string;
}

export default function LogViewer({ logs, title = 'Logs' }: Props) {
  if (logs.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">{title}</h3>
        <p className="text-xs text-gray-600 italic">No logs yet.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 mb-3">{title}</h3>
      <div className="bg-gray-950 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs space-y-0.5">
        {logs.map((line, i) => (
          <p key={i} className="text-green-400 leading-relaxed whitespace-pre-wrap break-all">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
