import { Link } from 'react-router-dom';
import {
  StickyNote,
  Monitor,
  FileText,
  Database,
  Plus,
  Loader2,
  LayoutTemplate,
} from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { useNotes } from '@/hooks/useNotes';
import { useAgendas } from '@/hooks/useAgendas';
import { useDemoAccounts } from '@/hooks/useDemoAccounts';
import { useDataMappings } from '@/hooks/useDataMappings';
import { useNoteTemplates } from '@/hooks/useNoteTemplates';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { notes, loading: notesLoading } = useNotes();
  const { agendas, loading: agendasLoading } = useAgendas();
  const { accounts, loading: demosLoading } = useDemoAccounts();
  const { templates: mappingTemplates, loading: mappingsLoading } = useDataMappings();
  const { templates: noteTemplates, loading: templatesLoading } = useNoteTemplates();

  const tiles = [
    {
      to: '/notes',
      icon: StickyNote,
      label: 'Notes',
      description: 'Meeting notes, discovery logs, and design docs',
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      count: notesLoading ? null : notes.length,
      countLabel: 'note',
    },
    {
      to: '/demo-selector',
      icon: Monitor,
      label: 'Demo Selector',
      description: 'Connect to NetSuite demo environments',
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      count: demosLoading ? null : accounts.length,
      countLabel: 'account',
    },
    {
      to: '/agendas',
      icon: FileText,
      label: 'Agendas',
      description: 'Build and export meeting agendas',
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      count: agendasLoading ? null : agendas.length,
      countLabel: 'agenda',
    },
    {
      to: '/data-workbench',
      icon: Database,
      label: 'Data Workbench',
      description: 'Upload, profile, and map data for NetSuite',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      count: mappingsLoading ? null : mappingTemplates.length,
      countLabel: 'mapping',
    },
    {
      to: '/notes/templates',
      icon: LayoutTemplate,
      label: 'Note Templates',
      description: 'Create and manage note templates per type',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      count: templatesLoading ? null : noteTemplates.length,
      countLabel: 'template',
    },
  ];

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

      {/* Quick Actions — dynamic from templates */}
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
          {templatesLoading ? (
            <span className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" />
              Loading templates...
            </span>
          ) : (
            noteTemplates.map((tmpl) => (
              <Link
                key={tmpl.id}
                to={`/notes/new?templateId=${tmpl.id}`}
                className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm transition hover:opacity-80"
                style={{
                  borderColor: tmpl.color + '4d',
                  backgroundColor: tmpl.color + '1a',
                  color: tmpl.color,
                }}
              >
                <Plus size={16} />
                {tmpl.name}
              </Link>
            ))
          )}
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
            <div className="mb-3 flex items-center justify-between">
              <tile.icon size={28} />
              {tile.count === null ? (
                <Loader2 size={14} className="animate-spin text-gray-500" />
              ) : (
                <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs font-medium">
                  {tile.count} {tile.countLabel}{tile.count !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white">{tile.label}</h3>
            <p className="mt-1 text-xs text-gray-400">{tile.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
