import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Wand2,
  Save,
  FolderOpen,
  Trash2,
  X,
  Loader2,
} from 'lucide-react';
import { NETSUITE_RECORD_TYPES } from '@/types';
import type {
  FieldMapping,
  NetSuiteRecordType,
  ColumnProfile,
  MappingTemplate,
} from '@/types';
import { getFieldsForRecordType } from './netsuite-fields';
import { TRANSFORM_OPTIONS } from './export-generator';

interface MappingStepProps {
  profiles: ColumnProfile[];
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  recordType: NetSuiteRecordType;
  templates: MappingTemplate[];
  templatesLoading: boolean;
  onMappingsChange: (mappings: FieldMapping[]) => void;
  onRecordTypeChange: (rt: NetSuiteRecordType) => void;
  onSaveTemplate: (name: string) => Promise<void>;
  onLoadTemplate: (template: MappingTemplate) => void;
  onDeleteTemplate: (id: string) => Promise<void>;
  onBack: () => void;
  onNext: () => void;
}

function normalize(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export function MappingStep({
  profiles,
  rows,
  mappings,
  recordType,
  templates,
  templatesLoading,
  onMappingsChange,
  onRecordTypeChange,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  onBack,
  onNext,
}: MappingStepProps) {
  const [templateName, setTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const fields = getFieldsForRecordType(recordType);
  const mappedCount = mappings.filter((m) => m.targetField).length;

  const updateMapping = (index: number, updates: Partial<FieldMapping>) => {
    const next = mappings.map((m, i) => (i === index ? { ...m, ...updates } : m));
    onMappingsChange(next);
  };

  const clearMapping = (index: number) => {
    updateMapping(index, { targetField: '', transform: 'none' });
  };

  const autoMatch = () => {
    const next = mappings.map((m) => {
      if (m.targetField) return m; // already mapped
      const srcNorm = normalize(m.sourceColumn);
      const match = fields.find((f) => {
        const idNorm = normalize(f.fieldId);
        const labelNorm = normalize(f.label);
        return idNorm === srcNorm || labelNorm === srcNorm || idNorm.includes(srcNorm) || srcNorm.includes(idNorm);
      });
      return match ? { ...m, targetField: match.fieldId } : m;
    });
    onMappingsChange(next);
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    setSaving(true);
    try {
      await onSaveTemplate(templateName.trim());
      setTemplateName('');
    } finally {
      setSaving(false);
    }
  };

  // Track which target fields are already used (to prevent duplicate mappings)
  const usedTargets = new Set(mappings.filter((m) => m.targetField).map((m) => m.targetField));

  return (
    <div>
      {/* Record type + auto-match */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400">Record Type:</label>
          <select
            value={recordType}
            onChange={(e) => onRecordTypeChange(e.target.value as NetSuiteRecordType)}
            className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
          >
            {NETSUITE_RECORD_TYPES.map((rt) => (
              <option key={rt.value} value={rt.value}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            {mappedCount} of {mappings.length} mapped
          </span>
          <button
            onClick={autoMatch}
            className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-sm text-purple-400 transition hover:bg-purple-500/20"
          >
            <Wand2 size={14} />
            Auto-Match
          </button>
        </div>
      </div>

      {/* Template save/load panel */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="text"
            placeholder="Template name..."
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveTemplate();
            }}
            className="rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={handleSaveTemplate}
            disabled={!templateName.trim() || saving}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Save
          </button>
        </div>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 transition hover:bg-[#222]"
        >
          <FolderOpen size={14} />
          Templates {templates.length > 0 && `(${templates.length})`}
        </button>
      </div>

      {/* Template list */}
      {showTemplates && (
        <div className="mb-4 rounded-lg border border-[#262626] bg-[#111111] p-3">
          {templatesLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 size={18} className="animate-spin text-gray-500" />
            </div>
          ) : templates.length === 0 ? (
            <p className="py-2 text-center text-xs text-gray-500">No saved templates yet.</p>
          ) : (
            <div className="space-y-2">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white">{t.name}</p>
                    <p className="text-xs text-gray-500">
                      {NETSUITE_RECORD_TYPES.find((r) => r.value === t.recordType)?.label} &middot;{' '}
                      {t.mappings.filter((m) => m.targetField).length} mappings
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onLoadTemplate(t);
                        setShowTemplates(false);
                      }}
                      className="rounded px-2 py-1 text-xs text-emerald-400 transition hover:bg-emerald-500/10"
                    >
                      Load
                    </button>
                    <button
                      onClick={() => onDeleteTemplate(t.id)}
                      className="rounded p-1 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mapping table */}
      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#262626] bg-[#111111]">
              <th className="px-4 py-3 font-medium text-gray-400">Source Column</th>
              <th className="px-4 py-3 font-medium text-gray-400">Type</th>
              <th className="px-4 py-3 font-medium text-gray-400">Sample</th>
              <th className="px-4 py-3 font-medium text-gray-400">NetSuite Field</th>
              <th className="px-4 py-3 font-medium text-gray-400">Transform</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {mappings.map((m, i) => {
              const profile = profiles.find((p) => p.name === m.sourceColumn);
              const sample = rows[0]?.[m.sourceColumn] ?? '';
              return (
                <tr key={m.sourceColumn} className="border-b border-[#1a1a1a] hover:bg-[#111111]">
                  <td className="px-4 py-2.5 font-medium text-white">{m.sourceColumn}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{profile?.detectedType || '—'}</td>
                  <td className="max-w-[140px] truncate px-4 py-2.5 text-xs text-gray-500">{sample}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={m.targetField}
                      onChange={(e) => updateMapping(i, { targetField: e.target.value })}
                      className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="">— Not mapped —</option>
                      {fields.map((f) => {
                        const taken = usedTargets.has(f.fieldId) && m.targetField !== f.fieldId;
                        return (
                          <option key={f.fieldId} value={f.fieldId} disabled={taken}>
                            {f.label}
                            {f.required ? ' *' : ''}
                            {taken ? ' (used)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={m.transform || 'none'}
                      onChange={(e) => updateMapping(i, { transform: e.target.value })}
                      disabled={!m.targetField}
                      className="w-full rounded border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
                    >
                      {TRANSFORM_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    {m.targetField && (
                      <button
                        onClick={() => clearMapping(i)}
                        className="rounded p-1 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400"
                        title="Clear mapping"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nav buttons */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1a1a1a] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#222]"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          onClick={onNext}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          Continue to Export
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
