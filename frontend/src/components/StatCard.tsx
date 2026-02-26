/**
 * components/StatCard.tsx
 */
interface Props {
  label: string;
  value: number | string;
  sub?: string;
  accent?: string; // tailwind bg class e.g. "bg-blue-900"
}

export default function StatCard({ label, value, sub, accent = 'bg-gray-800' }: Props) {
  return (
    <div className={`${accent} border border-gray-700 rounded-xl p-5`}>
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
