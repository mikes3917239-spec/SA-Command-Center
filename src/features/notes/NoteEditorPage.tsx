import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import { useDropzone } from 'react-dropzone';
import { useNotes } from '@/hooks/useNotes';
import { NOTE_TYPES, PRESET_TAGS } from '@/types';
import { NOTE_TEMPLATES } from './note-templates';
import { fetchWebsiteSummary, formatSummaryAsBlocks } from '@/lib/website-summarizer';
import { ArrowLeft, Save, Trash2, X, Globe, Loader2, Paperclip, Upload, FileText, Download } from 'lucide-react';
import type { NoteType, Attachment } from '@/types';
import type { Block } from '@blocknote/core';

export function NoteEditorPage() {
  const { noteId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notes, loading, createNote, updateNote, deleteNote, uploadAttachment, deleteAttachment } = useNotes();
  const isNew = noteId === 'new';
  const template = searchParams.get('template');

  const existingNote = useMemo(
    () => (isNew ? null : notes.find((n) => n.id === noteId)),
    [isNew, noteId, notes]
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

  const editor = useCreateBlockNote({
    domAttributes: {
      editor: { class: 'min-h-[400px]' },
    },
  });

  // Apply template to editor
  const applyTemplate = useCallback(
    (noteType: NoteType) => {
      const tmpl = NOTE_TEMPLATES[noteType];
      if (tmpl.blocks.length > 0) {
        editor.replaceBlocks(editor.document, tmpl.blocks);
      }
      if (tmpl.title && !title) {
        setTitle(tmpl.title);
      }
    },
    [editor, title]
  );

  // Load existing note data or apply template for new notes
  useEffect(() => {
    if (initialized) return;

    if (isNew) {
      const templateType = (template as NoteType) || 'general';
      if (template && NOTE_TEMPLATES[templateType]) {
        setType(templateType);
        applyTemplate(templateType);
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
      if (existingNote.content) {
        try {
          const blocks = JSON.parse(existingNote.content);
          editor.replaceBlocks(editor.document, blocks);
        } catch {
          // content might be empty or invalid
        }
      }
      setInitialized(true);
    }
  }, [isNew, existingNote, template, editor, initialized, applyTemplate]);

  // When type changes on a new note, offer to apply the template
  const handleTypeChange = (newType: NoteType) => {
    setType(newType);
    if (isNew) {
      applyTemplate(newType);
      const tmpl = NOTE_TEMPLATES[newType];
      if (tmpl.title) {
        setTitle(tmpl.title);
      }
    }
  };

  const handleSummarize = useCallback(async () => {
    if (!websiteUrl.trim()) return;
    setSummarizing(true);
    setSummarizeError('');
    try {
      const summary = await fetchWebsiteSummary(websiteUrl);
      const summaryBlocks = formatSummaryAsBlocks(summary);

      // Find the "Website Summary" heading in the editor and insert after it
      const blocks = editor.document;
      const summaryHeadingIndex = blocks.findIndex((b) => {
        const content = (b as unknown as { content?: Array<{ text?: string }> }).content;
        return content?.some((c) => c.text === 'Website Summary');
      });

      if (summaryHeadingIndex !== -1) {
        // Find the placeholder paragraph after the heading
        const nextBlock = blocks[summaryHeadingIndex + 1];
        if (nextBlock) {
          // Replace placeholder with summary blocks
          editor.replaceBlocks([nextBlock], summaryBlocks as unknown as Block[]);
        } else {
          // Insert after heading
          editor.insertBlocks(summaryBlocks as unknown as Block[], blocks[summaryHeadingIndex], 'after');
        }
      } else {
        // No "Website Summary" heading found — append at the end
        const lastBlock = blocks[blocks.length - 1];
        editor.insertBlocks(summaryBlocks as unknown as Block[], lastBlock, 'after');
      }
    } catch (err) {
      console.error('Summarize failed:', err);
      setSummarizeError(err instanceof Error ? err.message : 'Failed to fetch website');
    } finally {
      setSummarizing(false);
    }
  }, [websiteUrl, editor]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const content = JSON.stringify(editor.document);
      if (isNew) {
        const id = await createNote({
          title,
          content,
          tags,
          type,
          customer,
          opportunity,
          websiteUrl,
          attachments,
        });
        navigate(`/notes/${id}`, { replace: true });
      } else if (noteId) {
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
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [isNew, noteId, title, tags, type, customer, opportunity, websiteUrl, attachments, editor, createNote, updateNote, navigate]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

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
    <div>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/notes')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Notes
        </button>
        <div className="flex items-center gap-2">
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

      {/* Metadata fields */}
      <div className="mb-4 space-y-3">
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-[#262626] bg-[#111111] px-4 py-3 text-lg font-medium text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
        />

        <div className="flex flex-wrap gap-3">
          <select
            value={type}
            onChange={(e) => handleTypeChange(e.target.value as NoteType)}
            className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
          >
            {NOTE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
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
            className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-400 transition hover:bg-purple-500/20 disabled:opacity-40 disabled:hover:bg-purple-500/10"
          >
            {summarizing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Globe size={16} />
            )}
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
        {summarizeError && (
          <p className="text-xs text-red-400">{summarizeError}</p>
        )}

        {/* Tags */}
        <div>
          <div className="mb-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-1 text-xs text-emerald-400"
              >
                {tag}
                <button onClick={() => removeTag(tag)} className="hover:text-red-400">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addTag(tagInput);
                }
              }}
              className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
            />
            <div className="flex flex-wrap gap-1">
              {PRESET_TAGS.filter((t) => !tags.includes(t))
                .slice(0, 5)
                .map((tag) => (
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

      {/* Editor */}
      <div className="rounded-xl border border-[#262626] bg-[#1a1a1a] p-2 min-h-[500px]">
        <BlockNoteView editor={editor} theme="dark" />
      </div>

      {/* Documents / Attachments */}
      <div className="mt-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-300">
          <Paperclip size={16} />
          Documents
          {attachments.length > 0 && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
              {attachments.length}
            </span>
          )}
        </h3>

        {/* Uploaded files list */}
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

        {/* Drop zone */}
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
