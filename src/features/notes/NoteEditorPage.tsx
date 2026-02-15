import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/auth-store';
import { useNotes } from '@/hooks/useNotes';
import { useNoteTemplates } from '@/hooks/useNoteTemplates';
import { NOTE_TYPES, PRESET_TAGS } from '@/types';
import { NOTE_TEMPLATES } from './note-templates';
import { fetchWebsiteSummary, formatSummaryAsBlocks } from '@/lib/website-summarizer';
import {
  ArrowLeft,
  Save,
  Trash2,
  X,
  Globe,
  Loader2,
  Paperclip,
  Upload,
  FileText,
  Download,
  ChevronRight,
  ChevronDown,
  Plus,
  AlertTriangle,
} from 'lucide-react';
import type { NoteType, NoteSection, NoteTemplate, Attachment } from '@/types';
import type { Block } from '@blocknote/core';

// Helper to check if a note uses the legacy BlockNote format
function isLegacyNote(note: { content: string; sections: NoteSection[] }): boolean {
  return note.sections.length === 0 && !!note.content;
}

export function NoteEditorPage() {
  const { noteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notes, loading, createNote, updateNote, deleteNote, uploadAttachment, deleteAttachment } = useNotes();
  const { templates: noteTemplates } = useNoteTemplates();
  const isNew = noteId === 'new';
  const templateId = searchParams.get('templateId');
  const legacyTemplate = searchParams.get('template');

  const existingNote = useMemo(
    () => (isNew ? null : notes.find((n) => n.id === noteId)),
    [isNew, noteId, notes]
  );

  // Determine if this is a legacy note
  const isLegacy = useMemo(
    () => existingNote ? isLegacyNote(existingNote) : false,
    [existingNote]
  );

  const [title, setTitle] = useState('');
  const [type, setType] = useState<NoteType>('general');
  const [customer, setCustomer] = useState('');
  const [opportunity, setOpportunity] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeError, setSummarizeError] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Section-based state
  const [sections, setSections] = useState<NoteSection[]>([]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>('');

  // Legacy BlockNote editor — only used for old notes
  const editor = useCreateBlockNote({
    domAttributes: {
      editor: { class: 'min-h-[400px]' },
    },
    uploadFile: async (file: File) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error('Not authenticated');
      const fileId = crypto.randomUUID();
      const storageRef = ref(storage, `notes/${user.uid}/editor-images/${fileId}-${file.name}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    },
  });

  // Helper: apply a template's sections to the editor
  const applyTemplate = useCallback((tmpl: NoteTemplate) => {
    const newSections: NoteSection[] = tmpl.sections.map((s) => ({
      id: crypto.randomUUID(),
      title: s.title,
      bullets: s.defaultBullets.length > 0 ? [...s.defaultBullets] : [''],
      content: s.defaultContent || '',
      order: s.order,
    }));
    setSections(newSections);
    const openMap: Record<string, boolean> = {};
    newSections.forEach((s) => { openMap[s.id] = true; });
    setOpenSections(openMap);
    setActiveTemplateId(tmpl.id);
    return newSections;
  }, []);

  // Track which template is currently applied
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);

  // Initialize sections from template or existing note
  useEffect(() => {
    if (initialized) return;

    if (isNew) {
      // New note from a specific template (via ?templateId=)
      if (templateId) {
        const tmpl = noteTemplates.find((t) => t.id === templateId);
        if (tmpl) {
          setType(tmpl.noteType);
          setTitle(tmpl.name === 'General' ? '' : `${tmpl.name} — `);
          applyTemplate(tmpl);
          setInitialized(true);
          return;
        }
      }

      // Legacy template param (e.g., ?template=meeting)
      if (legacyTemplate) {
        const noteType = legacyTemplate as NoteType;
        if (NOTE_TYPES.some((t) => t.value === noteType)) {
          setType(noteType);
          const tmpl = noteTemplates.find((t) => t.noteType === noteType);
          if (tmpl) {
            setTitle(tmpl.name === 'General' ? '' : `${tmpl.name} — `);
            applyTemplate(tmpl);
            setInitialized(true);
            return;
          }
          // Fallback: use legacy template title
          const legacyTmpl = NOTE_TEMPLATES[noteType];
          if (legacyTmpl?.title) setTitle(legacyTmpl.title);
        }
      }

      // Default: auto-apply the template matching the current type
      const defaultTmpl = noteTemplates.find((t) => t.noteType === type);
      if (defaultTmpl) {
        applyTemplate(defaultTmpl);
      } else {
        // No template found — fall back to single empty section
        setSections([{
          id: crypto.randomUUID(),
          title: 'Notes',
          bullets: [''],
          content: '',
          order: 0,
        }]);
        setOpenSections({});
      }
      setInitialized(true);
    } else if (existingNote) {
      setTitle(existingNote.title);
      setType(existingNote.type);
      setCustomer(existingNote.customer);
      setOpportunity(existingNote.opportunity);
      setWebsiteUrl(existingNote.websiteUrl || '');
      setTags(existingNote.tags);
      setAttachments(existingNote.attachments || []);

      // Set active template based on note type
      const matchingTmpl = noteTemplates.find((t) => t.noteType === existingNote.type);
      if (matchingTmpl) setActiveTemplateId(matchingTmpl.id);

      if (existingNote.sections.length > 0) {
        // Section-based note
        setSections(existingNote.sections);
        const openMap: Record<string, boolean> = {};
        existingNote.sections.forEach((s) => { openMap[s.id] = true; });
        setOpenSections(openMap);
        lastSavedRef.current = JSON.stringify(existingNote.sections);
      } else if (existingNote.content) {
        // Legacy BlockNote note
        try {
          const blocks = JSON.parse(existingNote.content);
          editor.replaceBlocks(editor.document, blocks);
          lastSavedRef.current = existingNote.content;
        } catch {
          // content might be empty or invalid
        }
      }
      setInitialized(true);
    }
  }, [isNew, existingNote, templateId, legacyTemplate, noteTemplates, editor, initialized, type, applyTemplate]);

  // When type changes, auto-apply matching template
  const handleTypeChange = (newType: NoteType) => {
    setType(newType);
    if (!isLegacy) {
      const tmpl = noteTemplates.find((t) => t.noteType === newType);
      if (tmpl) {
        applyTemplate(tmpl);
      }
    }
  };

  // Explicitly switch to a different template (from the template dropdown)
  const handleTemplateChange = (tmplId: string) => {
    if (!tmplId) return;
    const tmpl = noteTemplates.find((t) => t.id === tmplId);
    if (tmpl) {
      setType(tmpl.noteType);
      applyTemplate(tmpl);
    }
  };

  const handleSummarize = useCallback(async () => {
    if (!websiteUrl.trim()) return;
    setSummarizing(true);
    setSummarizeError('');
    try {
      const summary = await fetchWebsiteSummary(websiteUrl);

      if (isLegacy) {
        // Legacy: insert into BlockNote editor
        const summaryBlocks = formatSummaryAsBlocks(summary);
        const blocks = editor.document;
        const summaryHeadingIndex = blocks.findIndex((b) => {
          const content = (b as unknown as { content?: Array<{ text?: string }> }).content;
          return content?.some((c) => c.text === 'Website Summary');
        });
        if (summaryHeadingIndex !== -1) {
          const nextBlock = blocks[summaryHeadingIndex + 1];
          if (nextBlock) {
            editor.replaceBlocks([nextBlock], summaryBlocks as unknown as Block[]);
          } else {
            editor.insertBlocks(summaryBlocks as unknown as Block[], blocks[summaryHeadingIndex], 'after');
          }
        } else {
          const lastBlock = blocks[blocks.length - 1];
          editor.insertBlocks(summaryBlocks as unknown as Block[], lastBlock, 'after');
        }
      } else {
        // Section-based: find "Website Summary" section and populate it
        const summaryText = [
          summary.title && `Title: ${summary.title}`,
          summary.description && `Description: ${summary.description}`,
          ...(summary.headings || []).map((h: string) => h),
        ].filter(Boolean).join('\n');

        setSections((prev) => {
          const idx = prev.findIndex((s) => s.title.toLowerCase().includes('website summary'));
          if (idx !== -1) {
            return prev.map((s, i) =>
              i === idx ? { ...s, content: summaryText } : s
            );
          }
          // If no website summary section, add one
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              title: 'Website Summary',
              bullets: [],
              content: summaryText,
              order: prev.length,
            },
          ];
        });
      }
    } catch (err) {
      console.error('Summarize failed:', err);
      setSummarizeError(err instanceof Error ? err.message : 'Failed to fetch website');
    } finally {
      setSummarizing(false);
    }
  }, [websiteUrl, editor, isLegacy]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (isNew) {
        const id = await createNote({
          title,
          content: '',
          sections,
          tags,
          type,
          customer,
          opportunity,
          websiteUrl,
          attachments,
        });
        navigate(`/notes/${id}`, { replace: true });
      } else if (noteId) {
        if (isLegacy) {
          const content = JSON.stringify(editor.document);
          await updateNote(noteId, {
            title,
            content,
            tags,
            type,
            customer,
            opportunity,
            websiteUrl,
            attachments,
          });
          lastSavedRef.current = content;
        } else {
          await updateNote(noteId, {
            title,
            sections,
            tags,
            type,
            customer,
            opportunity,
            websiteUrl,
            attachments,
          });
          lastSavedRef.current = JSON.stringify(sections);
        }
        setAutoSaveStatus('saved');
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [isNew, noteId, isLegacy, title, sections, tags, type, customer, opportunity, websiteUrl, attachments, editor, createNote, updateNote, navigate]);

  // Auto-save with 2s debounce
  const scheduleAutoSave = useCallback(() => {
    if (isNew || !noteId || !initialized) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      const currentData = isLegacy ? JSON.stringify(editor.document) : JSON.stringify(sections);
      if (currentData === lastSavedRef.current) return;
      setAutoSaveStatus('saving');
      try {
        if (isLegacy) {
          await updateNote(noteId, {
            title, content: currentData, tags, type, customer, opportunity, websiteUrl, attachments,
          });
        } else {
          await updateNote(noteId, {
            title, sections, tags, type, customer, opportunity, websiteUrl, attachments,
          });
        }
        lastSavedRef.current = currentData;
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Auto-save failed:', err);
        setAutoSaveStatus('idle');
      }
    }, 2000);
  }, [isNew, noteId, initialized, isLegacy, editor, sections, title, tags, type, customer, opportunity, websiteUrl, attachments, updateNote]);

  // Trigger auto-save on metadata/section changes
  useEffect(() => {
    if (!initialized || isNew) return;
    scheduleAutoSave();
  }, [title, tags, type, customer, opportunity, websiteUrl, sections, initialized, isNew, scheduleAutoSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  // Ctrl+S / Cmd+S
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  // Tag helpers
  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) setTags([...tags, trimmed]);
    setTagInput('');
  };
  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  // Section editing helpers
  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const updateSectionField = (sectionId: string, field: keyof NoteSection, value: unknown) => {
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, [field]: value } : s)));
  };

  const addBullet = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, bullets: [...s.bullets, ''] } : s))
    );
  };

  const updateBullet = (sectionId: string, index: number, value: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, bullets: s.bullets.map((b, i) => (i === index ? value : b)) }
          : s
      )
    );
  };

  const removeBullet = (sectionId: string, index: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, bullets: s.bullets.filter((_, i) => i !== index) }
          : s
      )
    );
  };

  const addSection = () => {
    const newSection: NoteSection = {
      id: crypto.randomUUID(),
      title: 'New Section',
      bullets: [''],
      content: '',
      order: sections.length,
    };
    setSections((prev) => [...prev, newSection]);
    setOpenSections((prev) => ({ ...prev, [newSection.id]: true }));
  };

  const removeSection = (sectionId: string) => {
    if (sections.length <= 1) return;
    setSections((prev) =>
      prev.filter((s) => s.id !== sectionId).map((s, i) => ({ ...s, order: i }))
    );
  };

  // File handling
  const handleFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!noteId || isNew) return;
      setUploading(true);
      try {
        const uploaded: Attachment[] = [];
        for (const file of acceptedFiles) {
          const attachment = await uploadAttachment(noteId, file);
          uploaded.push(attachment);
        }
        const updated = [...attachments, ...uploaded];
        setAttachments(updated);
        await updateNote(noteId, { attachments: updated });
      } catch (err) {
        console.error('Upload failed:', err);
      } finally {
        setUploading(false);
      }
    },
    [noteId, isNew, attachments, uploadAttachment, updateNote]
  );

  const handleDeleteAttachment = useCallback(
    async (attachment: Attachment) => {
      if (!noteId) return;
      try {
        await deleteAttachment(attachment);
        const updated = attachments.filter((a) => a.id !== attachment.id);
        setAttachments(updated);
        await updateNote(noteId, { attachments: updated });
      } catch (err) {
        console.error('Delete attachment failed:', err);
      }
    },
    [noteId, attachments, deleteAttachment, updateNote]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    disabled: isNew || uploading,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!isNew && loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isNew && !existingNote && !loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        Note not found.
        <button onClick={() => navigate('/notes')} className="ml-2 text-emerald-400 hover:underline">
          Back to notes
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[960px]">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Notes
        </button>
        <div className="flex items-center gap-3">
          {!isNew && autoSaveStatus !== 'idle' && (
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              {autoSaveStatus === 'saving' && (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Saving...
                </>
              )}
              {autoSaveStatus === 'saved' && (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Saved
                </>
              )}
            </span>
          )}
          {!isNew && (
            <button
              onClick={async () => {
                if (confirm('Delete this note? This cannot be undone.')) {
                  await deleteNote(noteId!);
                  navigate('/notes');
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
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

      {/* Notion-style inline title */}
      <input
        type="text"
        placeholder="Untitled"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="note-inline-title mb-1 w-full border-none bg-transparent px-[50px] text-3xl font-bold text-white placeholder-[#3a3a3a] focus:outline-none"
      />

      {/* Collapsible metadata panel */}
      <div className="mb-4 px-[50px]">
        <button
          onClick={() => setMetadataOpen(!metadataOpen)}
          className="flex items-center gap-1.5 text-xs text-gray-500 transition hover:text-gray-300"
        >
          <ChevronRight
            size={14}
            className={`transition-transform ${metadataOpen ? 'rotate-90' : ''}`}
          />
          Properties
        </button>

        {metadataOpen && (
          <div className="mt-2 space-y-3">
            <div className="flex flex-wrap gap-3">
              <select
                value={type}
                onChange={(e) => handleTypeChange(e.target.value as NoteType)}
                className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {!isLegacy && (
                <select
                  value={activeTemplateId || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="" disabled>Template...</option>
                  {noteTemplates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>{tmpl.name}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                placeholder="Customer"
                value={customer}
                onChange={(e) => setCustomer(e.target.value)}
                className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Opportunity"
                value={opportunity}
                onChange={(e) => setOpportunity(e.target.value)}
                className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {/* Website URL + Summarize */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="url"
                  placeholder="Company website URL (e.g. https://example.com)"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] py-2 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                onClick={handleSummarize}
                disabled={!websiteUrl.trim() || summarizing}
                className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-400 transition hover:bg-purple-500/20 disabled:opacity-40"
              >
                {summarizing ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                {summarizing ? 'Summarizing...' : 'Summarize Website'}
              </button>
              {websiteUrl.trim() && (
                <a
                  href={websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-400 transition hover:text-white"
                >
                  Open
                </a>
              )}
            </div>
            {summarizeError && <p className="text-xs text-red-400">{summarizeError}</p>}

            {/* Tags */}
            <div>
              <div className="mb-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-400">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="hover:text-red-400"><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                  className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                />
                <div className="flex flex-wrap gap-1">
                  {PRESET_TAGS.filter((t) => !tags.includes(t)).slice(0, 5).map((tag) => (
                    <button
                      key={tag}
                      onClick={() => addTag(tag)}
                      className="rounded border border-[#262626] bg-[#111111] px-2 py-1 text-xs text-gray-500 transition hover:border-emerald-500 hover:text-emerald-400"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Content Area ── */}
      {isLegacy ? (
        /* Legacy BlockNote editor for old notes */
        <div>
          <div className="mx-[50px] mb-3 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
            <AlertTriangle size={14} />
            Legacy note — using rich text editor. New notes use the section-based editor.
          </div>
          <div className="min-h-[500px]">
            <BlockNoteView
              editor={editor}
              theme="dark"
              onChange={() => scheduleAutoSave()}
            />
          </div>
        </div>
      ) : (
        /* Section-based editor */
        <div className="space-y-3 px-[50px]">
          {sections.map((section) => (
            <div
              key={section.id}
              className="rounded-xl border border-[#262626] bg-[#111111] overflow-hidden"
            >
              {/* Section header */}
              <div
                onClick={() => toggleSection(section.id)}
                className="flex w-full cursor-pointer items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{section.title}</span>
                  {section.bullets.filter((b) => b.trim()).length > 0 && (
                    <span className="text-[10px] text-gray-500">
                      {section.bullets.filter((b) => b.trim()).length} bullet{section.bullets.filter((b) => b.trim()).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {sections.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                      className="rounded p-1 text-gray-600 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                  {openSections[section.id] ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </div>
              </div>

              {/* Section body */}
              {openSections[section.id] && (
                <div className="border-t border-[#262626] px-4 py-4 space-y-3">
                  {/* Section title editing */}
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => updateSectionField(section.id, 'title', e.target.value)}
                    className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-2 py-1 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
                    placeholder="Section title"
                  />

                  {/* Bullets */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Bullet points</label>
                    {section.bullets.map((bullet, bi) => (
                      <div key={bi} className="mb-1 flex items-center gap-1">
                        <span className="text-xs text-gray-600">&bull;</span>
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(section.id, bi, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addBullet(section.id);
                              // Focus next input after render
                              setTimeout(() => {
                                const parent = (e.target as HTMLElement).closest('[class*="space-y"]');
                                if (parent) {
                                  const inputs = parent.querySelectorAll('input[type="text"]');
                                  const nextInput = inputs[bi + 1] as HTMLInputElement;
                                  nextInput?.focus();
                                }
                              }, 0);
                            }
                          }}
                          className="flex-1 rounded border border-[#262626] bg-[#0a0a0a] px-2 py-1 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                          placeholder="Type a bullet point..."
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
                  </div>

                  {/* Freeform textarea */}
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Additional notes</label>
                    <textarea
                      value={section.content}
                      onChange={(e) => updateSectionField(section.id, 'content', e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded-lg border border-[#262626] bg-[#0a0a0a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="Freeform notes for this section..."
                    />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Section button */}
          <button
            onClick={addSection}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#333] bg-[#0a0a0a] py-2.5 text-sm text-gray-400 transition hover:border-emerald-500 hover:text-emerald-400"
          >
            <Plus size={14} />
            Add Section
          </button>
        </div>
      )}

      {/* Documents / Attachments */}
      <div className="mt-4 px-[50px]">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
          <Paperclip size={16} />
          Documents
          {attachments.length > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
              {attachments.length}
            </span>
          )}
        </h3>

        {attachments.length > 0 && (
          <div className="mb-3 space-y-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-lg border border-[#262626] bg-[#1a1a1a] px-4 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText size={18} className="shrink-0 text-gray-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{att.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(att.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-1.5 text-gray-400 transition hover:bg-[#262626] hover:text-white"
                    title="Download"
                  >
                    <Download size={15} />
                  </a>
                  <button
                    onClick={() => handleDeleteAttachment(att)}
                    className="rounded p-1.5 text-gray-400 transition hover:bg-red-500/10 hover:text-red-400"
                    title="Remove"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {isNew ? (
          <p className="rounded-lg border border-dashed border-[#333] bg-[#111111] px-4 py-6 text-center text-xs text-gray-500">
            Save the note first to attach documents.
          </p>
        ) : (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
              isDragActive
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#333] bg-[#111111] hover:border-[#444] hover:bg-[#161616]'
            }`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 size={20} className="animate-spin text-emerald-400" />
                <p className="text-xs text-gray-400">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload size={20} className={isDragActive ? 'text-emerald-400' : 'text-gray-500'} />
                <p className="text-xs text-gray-400">
                  {isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
