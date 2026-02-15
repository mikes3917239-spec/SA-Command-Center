import { Link } from 'react-router-dom';
import {
  StickyNote,
  Monitor,
  FileText,
  Database,
  Plus,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';

const tiles = [
  {
    to: '/notes',
    icon: StickyNote,
    label: 'Notes',
    description: 'Meeting notes, discovery logs, and design docs',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    count: null as string | null,
  },
  {
    to: '/demo-selector',
    icon: Monitor,
    label: 'Demo Selector',
    description: 'Connect to NetSuite demo environments',
    color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    count: null,
  },
  {
    to: '/agendas',
    icon: FileText,
    label: 'Agendas',
    description: 'Build and export meeting agendas',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    count: null,
  },
  {
    to: '/data-workbench',
    icon: Database,
    label: 'Data Workbench',
    description: 'Upload, profile, and map data for NetSuite',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    count: null,
  },
];

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-gray-400">
          Your SA Command Center — everything in one place.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
          New Note from Template
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/notes/new"
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400 transition hover:bg-emerald-500/20"
          >
            <Plus size={16} />
            Blank Note
          </Link>
          <Link
            to="/notes/new?template=meeting"
            className="flex items-center gap-2 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400 transition hover:bg-blue-500/20"
          >
            <Plus size={16} />
            Meeting
          </Link>
          <Link
            to="/notes/new?template=discovery"
            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-400 transition hover:bg-purple-500/20"
          >
            <Plus size={16} />
            Discovery
          </Link>
          <Link
            to="/notes/new?template=design"
            className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-400 transition hover:bg-cyan-500/20"
          >
            <Plus size={16} />
            Design
          </Link>
          <Link
            to="/notes/new?template=issue"
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400 transition hover:bg-red-500/20"
          >
            <Plus size={16} />
            Issue
          </Link>
        </div>
      </div>

      {/* Module Tiles */}
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
        Modules
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className={`group rounded-xl border p-5 transition hover:scale-[1.02] ${tile.color}`}
          >
            <tile.icon size={28} className="mb-3" />
            <h3 className="text-lg font-semibold text-white">{tile.label}</h3>
            <p className="mt-1 text-xs text-gray-400">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
