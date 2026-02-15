import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotes } from '@/hooks/useNotes';
import { Plus, Search, Trash2, StickyNote, Settings } from 'lucide-react';
import { NOTE_TYPES } from '@/types';
import type { NoteType } from '@/types';

export function NotesListPage() {
  const { notes, loading, deleteNote } = useNotes();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<NoteType | 'all'>('all');
  const [filterTag, setFilterTag] = useState('');

  const filtered = notes.filter((note) => {
    const matchesSearch =
      !searchQuery ||
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.opportunity.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || note.type === filterType;
    const matchesTag = !filterTag || note.tags.includes(filterTag);
    return matchesSearch && matchesType && matchesTag;
  });

  const allTags = [...new Set(notes.flatMap((n) => n.tags))].sort();

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
          <h1 className="text-2xl font-bold text-white">Notes</h1>
          <p className="mt-1 text-sm text-gray-400">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/notes/new"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
          >
            <Plus size={16} />
            New
          </Link>
          {(['meeting', 'discovery', 'design', 'issue'] as const).map((tmpl) => (
            <Link
              key={tmpl}
              to={`/notes/new?template=${tmpl}`}
              className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 transition hover:bg-[#262626]"
            >
              <Plus size={14} />
              {tmpl.charAt(0).toUpperCase() + tmpl.slice(1)}
            </Link>
          ))}
          <Link
            to="/notes/templates"
            className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-400 transition hover:bg-[#262626] hover:text-white"
          >
            <Settings size={14} />
            Manage Templates
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as NoteType | 'all')}
          className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
        >
          <option value="all">All types</option>
          {NOTE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
          >
            <option value="">All tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Notes List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#111111] py-16">
          <StickyNote size={48} className="mb-4 text-gray-600" />
          <p className="text-gray-400">
            {notes.length === 0 ? 'No Notes Saved Yet' : 'No notes match your filters.'}
          </p>
          {notes.length === 0 && (
            <Link
              to="/notes/new"
              className="mt-4 text-sm text-emerald-400 hover:underline"
            >
              Create your first note
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((note) => {
            const typeInfo = NOTE_TYPES.find((t) => t.value === note.type);
            // Extract preview from sections or fallback to empty
            const preview = note.sections.length > 0
              ? note.sections
                  .flatMap((s) => s.bullets.filter((b) => b.text.trim()).map((b) => b.text))
                  .slice(0, 3)
                  .join(' · ') || note.sections[0]?.content?.slice(0, 100) || ''
              : '';
            return (
              <Link
                key={note.id}
                to={`/notes/${note.id}`}
                className="group flex items-start justify-between rounded-xl border border-[#262626] bg-[#111111] p-4 transition hover:border-[#333]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium text-white">
                      {note.title || 'Untitled'}
                    </h3>
                    {typeInfo && (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: typeInfo.color + '20',
                          color: typeInfo.color,
                        }}
                      >
                        {typeInfo.label}
                      </span>
                    )}
                  </div>
                  {preview && (
                    <p className="mt-1 truncate text-xs text-gray-500">{preview}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    {note.customer && <span>{note.customer}</span>}
                    {note.opportunity && <span>{note.opportunity}</span>}
                    <span>{note.updatedAt.toLocaleDateString()}</span>
                  </div>
                  {note.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#1a1a1a] px-2 py-0.5 text-xs text-gray-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (confirm('Delete this note?')) {
                      deleteNote(note.id);
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
