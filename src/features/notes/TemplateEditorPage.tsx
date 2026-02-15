import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNoteTemplates } from '@/hooks/useNoteTemplates';
import { NOTE_TYPES } from '@/types';
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  X,
  RotateCcw,
} from 'lucide-react';
import type { NoteType, TemplateSectionDef } from '@/types';

const TEMPLATE_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444', '#6b7280',
  '#f59e0b', '#10b981', '#ec4899', '#f97316',
];

export function TemplateEditorPage() {
  const { templates, loading, createTemplate, updateTemplate, deleteTemplate, resetBuiltIn } = useNoteTemplates();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNoteType, setEditNoteType] = useState<NoteType>('general');
  const [editColor, setEditColor] = useState('#6b7280');
  const [editSections, setEditSections] = useState<TemplateSectionDef[]>([]);
  const [saving, setSaving] = useState(false);

  const startEdit = (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    setEditingId(templateId);
    setEditName(tmpl.name);
    setEditNoteType(tmpl.noteType);
    setEditColor(tmpl.color);
    setEditSections(tmpl.sections.map((s) => ({ ...s })));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNoteType('general');
    setEditColor('#6b7280');
    setEditSections([]);
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      await updateTemplate(editingId, {
        name: editName,
        noteType: editNoteType,
        color: editColor,
        sections: editSections,
      });
      cancelEdit();
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = async () => {
    setSaving(true);
    try {
      const defaultSections: TemplateSectionDef[] = [
        {
          id: crypto.randomUUID(),
          title: 'Notes',
          description: 'General notes',
          defaultBullets: [],
          defaultContent: '',
          order: 0,
        },
      ];
      const id = await createTemplate({
        name: 'New Template',
        noteType: 'general',
        color: '#10b981',
        sections: defaultSections,
      });
      // Directly populate edit state instead of waiting for Firestore listener
      setEditingId(id);
      setEditName('New Template');
      setEditNoteType('general');
      setEditColor('#10b981');
      setEditSections(defaultSections);
    } catch (err) {
      console.error('Create failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Delete this template? This cannot be undone.')) return;
    await deleteTemplate(templateId);
    if (editingId === templateId) cancelEdit();
  };

  const handleReset = async (templateId: string) => {
    const tmpl = templates.find((t) => t.id === templateId);
    if (!tmpl) return;
    // Derive the key from noteType (which matches DEFAULT_TEMPLATE_SECTIONS keys)
    const key = tmpl.noteType;
    if (!confirm('Reset this template to defaults?')) return;
    await resetBuiltIn(templateId, key);
    if (editingId === templateId) cancelEdit();
  };

  // Section editing helpers
  const updateSection = (sectionId: string, field: keyof TemplateSectionDef, value: unknown) => {
    setEditSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s))
    );
  };

  const addSection = () => {
    setEditSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: 'New Section',
        description: '',
        defaultBullets: [],
        defaultContent: '',
        order: prev.length,
      },
    ]);
  };

  const removeSection = (sectionId: string) => {
    setEditSections((prev) =>
      prev.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order: i }))
    );
  };

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    setEditSections((prev) => {
      const idx = prev.findIndex((s) => s.id === sectionId);
      if (idx < 0) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[targetIdx]] = [next[targetIdx], next[idx]];
      return next.map((s, i) => ({ ...s, order: i }));
    });
  };

  const addBullet = (sectionId: string) => {
    setEditSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, defaultBullets: [...s.defaultBullets, ''] } : s
      )
    );
  };

  const updateBullet = (sectionId: string, index: number, value: string) => {
    setEditSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, defaultBullets: s.defaultBullets.map((b, i) => (i === index ? value : b)) }
          : s
      )
    );
  };

  const removeBullet = (sectionId: string, index: number) => {
    setEditSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, defaultBullets: s.defaultBullets.filter((_, i) => i !== index) }
          : s
      )
    );
  };

  const moveBullet = (sectionId: string, index: number, direction: 'up' | 'down') => {
    setEditSections((prev) =>
      prev.map((s) => {
        if (s.id !== sectionId) return s;
        const targetIdx = direction === 'up' ? index - 1 : index + 1;
        if (targetIdx < 0 || targetIdx >= s.defaultBullets.length) return s;
        const next = [...s.defaultBullets];
        [next[index], next[targetIdx]] = [next[targetIdx], next[index]];
        return { ...s, defaultBullets: next };
      })
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#1a1a1a]" />
        ))}
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none';

  return (
    <div className="mx-auto max-w-[800px]">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/notes"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to Notes
          </Link>
          <h1 className="text-xl font-bold text-white">Note Templates</h1>
        </div>
        <button
          onClick={handleCreateNew}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          <Plus size={16} />
          New Template
        </button>
      </div>

      {/* Template cards */}
      <div className="space-y-3">
        {templates.map((tmpl) => {
          const isEditing = editingId === tmpl.id;
          const typeInfo = NOTE_TYPES.find((t) => t.value === (isEditing ? editNoteType : tmpl.noteType));

          return (
            <div
              key={tmpl.id}
              className="rounded-xl border border-[#262626] bg-[#111111] overflow-hidden"
            >
              {/* Card header */}
              <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer"
                onClick={() => (isEditing ? undefined : startEdit(tmpl.id))}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: isEditing ? editColor : tmpl.color }}
                  />
                  <span className="font-medium text-white">
                    {isEditing ? editName : tmpl.name}
                  </span>
                  {typeInfo && (
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ backgroundColor: typeInfo.color + '20', color: typeInfo.color }}
                    >
                      {typeInfo.label}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {tmpl.sections.length} section{tmpl.sections.length !== 1 ? 's' : ''}
                  </span>
                  {tmpl.isBuiltIn && (
                    <span className="rounded bg-gray-700/50 px-1.5 py-0.5 text-[10px] text-gray-400">
                      Built-in
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {tmpl.isBuiltIn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleReset(tmpl.id); }}
                      className="rounded p-1.5 text-gray-500 transition hover:bg-[#262626] hover:text-white"
                      title="Reset to defaults"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {!tmpl.isBuiltIn && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(tmpl.id); }}
                      className="rounded p-1.5 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Delete template"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {isEditing ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Edit panel */}
              {isEditing && (
                <div className="border-t border-[#262626] px-4 py-4 space-y-4">
                  {/* Name + Note Type + Color */}
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-gray-400">Template Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Note Type</label>
                      <select
                        value={editNoteType}
                        onChange={(e) => setEditNoteType(e.target.value as NoteType)}
                        className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
                      >
                        {NOTE_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-400">Color</label>
                    <div className="flex gap-1.5">
                      {TEMPLATE_COLORS.map((c) => (
                        <button
                          key={c}
                          onClick={() => setEditColor(c)}
                          className={`h-7 w-7 rounded-full border-2 transition ${
                            editColor === c ? 'border-white scale-110' : 'border-transparent'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Sections list */}
                  <div>
                    <label className="mb-2 block text-xs text-gray-400">Sections</label>
                    <div className="space-y-2">
                      {editSections.map((section, idx) => (
                        <div
                          key={section.id}
                          className="rounded-lg border border-[#262626] bg-[#0a0a0a] p-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                              <button
                                onClick={() => moveSection(section.id, 'up')}
                                disabled={idx === 0}
                                className="rounded p-0.5 text-gray-600 hover:text-white disabled:opacity-30"
                              >
                                <ChevronUp size={12} />
                              </button>
                              <button
                                onClick={() => moveSection(section.id, 'down')}
                                disabled={idx === editSections.length - 1}
                                className="rounded p-0.5 text-gray-600 hover:text-white disabled:opacity-30"
                              >
                                <ChevronDown size={12} />
                              </button>
                            </div>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                              className="flex-1 rounded border border-[#262626] bg-[#111111] px-2 py-1 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
                              placeholder="Section title"
                            />
                            <button
                              onClick={() => removeSection(section.id)}
                              className="rounded p-1 text-gray-600 hover:text-red-400"
                              title="Remove section"
                            >
                              <X size={14} />
                            </button>
                          </div>

                          <div className="mt-2 pl-7">
                            <input
                              type="text"
                              value={section.description}
                              onChange={(e) => updateSection(section.id, 'description', e.target.value)}
                              className="mb-2 w-full rounded border border-[#262626] bg-[#111111] px-2 py-1 text-xs text-gray-400 placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                              placeholder="Section description / hint"
                            />

                            <label className="mb-1 block text-[10px] text-gray-500">Default bullets (structured prompts)</label>
                            {section.defaultBullets.map((bullet, bi) => (
                              <div key={bi} className="mb-1 flex items-center gap-1">
                                <div className="flex flex-col">
                                  <button
                                    onClick={() => moveBullet(section.id, bi, 'up')}
                                    disabled={bi === 0}
                                    className="rounded p-0 text-gray-600 hover:text-white disabled:opacity-30"
                                  >
                                    <ChevronUp size={10} />
                                  </button>
                                  <button
                                    onClick={() => moveBullet(section.id, bi, 'down')}
                                    disabled={bi === section.defaultBullets.length - 1}
                                    className="rounded p-0 text-gray-600 hover:text-white disabled:opacity-30"
                                  >
                                    <ChevronDown size={10} />
                                  </button>
                                </div>
                                <span className="text-xs text-gray-600">&bull;</span>
                                <input
                                  type="text"
                                  value={bullet}
                                  onChange={(e) => updateBullet(section.id, bi, e.target.value)}
                                  className="flex-1 rounded border border-[#262626] bg-[#111111] px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                                  placeholder="Default bullet text..."
                                />
                                <button
                                  onClick={() => removeBullet(section.id, bi)}
                                  className="rounded p-0.5 text-gray-600 hover:text-red-400"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => addBullet(section.id)}
                              className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                            >
                              <Plus size={12} />
                              Add bullet
                            </button>

                            <label className="mt-3 mb-1 block text-[10px] text-gray-500">Default freeform text / questions</label>
                            <textarea
                              value={section.defaultContent || ''}
                              onChange={(e) => updateSection(section.id, 'defaultContent', e.target.value)}
                              rows={3}
                              className="w-full resize-y rounded border border-[#262626] bg-[#111111] px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                              placeholder="Pre-filled questions or notes for this section (e.g. What are your top pain points?)"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addSection}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#333] bg-[#0a0a0a] py-2.5 text-sm text-gray-400 transition hover:border-emerald-500 hover:text-emerald-400"
                    >
                      <Plus size={14} />
                      Add Section
                    </button>
                  </div>

                  {/* Save / Cancel */}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={cancelEdit}
                      className="rounded-lg border border-[#262626] px-4 py-2 text-sm text-gray-400 transition hover:bg-[#1a1a1a]"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
                    >
                      <Save size={16} />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {templates.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#111111] py-16">
            <p className="text-gray-400">No templates found. They will be seeded automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
