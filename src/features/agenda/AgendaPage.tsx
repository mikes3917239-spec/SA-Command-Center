import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAgendas } from '@/hooks/useAgendas';
import { Plus, Search, Trash2, CalendarDays } from 'lucide-react';
import { AGENDA_STATUSES } from '@/types';
import type { AgendaStatus } from '@/types';

export function AgendaPage() {
  const { agendas, loading, deleteAgenda } = useAgendas();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<AgendaStatus | 'all'>('all');

  const filtered = agendas.filter((agenda) => {
    const matchesSearch =
      !searchQuery ||
      agenda.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agenda.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || agenda.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#1a1a1a]" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Agendas</h1>
          <p className="mt-1 text-sm text-gray-400">
            {agendas.length} agenda{agendas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/agendas/new"
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          <Plus size={16} />
          New Agenda
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as AgendaStatus | 'all')}
          className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All statuses</option>
          {AGENDA_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Agendas List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#111111] py-16">
          <CalendarDays size={48} className="mb-4 text-gray-600" />
          <p className="text-gray-400">
            {agendas.length === 0 ? 'No Agendas Created Yet' : 'No agendas match your filters.'}
          </p>
          {agendas.length === 0 && (
            <Link
              to="/agendas/new"
              className="mt-4 text-sm text-emerald-400 hover:underline"
            >
              Create your first agenda
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((agenda) => {
            const statusInfo = AGENDA_STATUSES.find((s) => s.value === agenda.status);
            const enabledSections = agenda.sections.filter((s) => s.enabled).length;
            return (
              <Link
                key={agenda.id}
                to={`/agendas/${agenda.id}`}
                className="group flex items-start justify-between rounded-xl border border-[#262626] bg-[#111111] p-4 transition hover:border-[#333]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-white">
                      {agenda.customerName || 'Untitled Agenda'}
                    </h3>
                    {statusInfo && (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: statusInfo.color + '20',
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    {agenda.dateTime && (
                      <span>
                        {new Date(agenda.dateTime).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                    <span>{enabledSections} section{enabledSections !== 1 ? 's' : ''}</span>
                    <span>{agenda.updatedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Delete this agenda?')) {
                      deleteAgenda(agenda.id);
                    }
                  }}
                  className="ml-4 rounded p-1 text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
