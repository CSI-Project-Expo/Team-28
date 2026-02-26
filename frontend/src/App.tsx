import { Routes, Route, NavLink } from 'react-router-dom';
import ReportPage from './pages/ReportPage';
import DashboardPage from './pages/DashboardPage';
import IssueDetailPage from './pages/IssueDetailPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ──Nav ───────────────────────────────────────────────────────────── */}
      <header className="border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <span className="font-bold text-lg text-blue-400 tracking-tight">
            🩺 Site Surgeon
          </span>
          <nav className="flex gap-4 ml-4">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`
              }
            >
              Report Issue
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                }`
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <Routes>
          <Route path="/" element={<ReportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/issues/:id" element={<IssueDetailPage />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-800 py-4 text-center text-xs text-gray-600">
        Site Surgeon – AI Self-Healing Web System
      </footer>
    </div>
  );
}
