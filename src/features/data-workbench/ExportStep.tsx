import { useMemo } from 'react';
import {
  Download,
  RotateCcw,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import type { ColumnProfile, FieldMapping, NetSuiteRecordType } from '@/types';
import { NETSUITE_RECORD_TYPES } from '@/types';
import { generateExport, downloadCsv } from './export-generator';
import { generateWorkbenchXlsx } from './generate-workbench-xlsx';
import { ExportDropdown } from '@/components/ExportDropdown';

interface ExportStepProps {
  rows: Record<string, string>[];
  mappings: FieldMapping[];
  recordType: NetSuiteRecordType;
  profiles: ColumnProfile[];
  onBack: () => void;
  onStartOver: () => void;
}

export function ExportStep({ rows, mappings, recordType, profiles, onBack, onStartOver }: ExportStepProps) {
  const result = useMemo(
    () => generateExport(rows, mappings, recordType),
    [rows, mappings, recordType]
  );

  const errors = result.issues.filter((i) => i.type === 'error');
  const warnings = result.issues.filter((i) => i.type === 'warning');
  const hasErrors = errors.length > 0;

  // Parse CSV preview (first 5 rows)
  const previewLines = result.csvContent.split('\n').slice(0, 6); // header + 5 data rows
  const previewHeaders = previewLines[0]?.split(',').map((h) => h.replace(/^"|"$/g, '')) || [];
  const previewRows = previewLines.slice(1).map((line) =>
    line.split(',').map((cell) => cell.replace(/^"|"$/g, ''))
  );

  const recordLabel = NETSUITE_RECORD_TYPES.find((r) => r.value === recordType)?.label || recordType;

  return (
    <div>
      {/* Validation checklist */}
      <div className="mb-6 rounded-lg border border-[#262626] bg-[#111111] p-5">
        <h3 className="mb-3 text-sm font-medium text-white">Validation</h3>

        {result.issues.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-emerald-400">
            <CheckCircle2 size={16} />
            All checks passed — ready to export.
          </div>
        ) : (
          <div className="space-y-2">
            {errors.map((issue, i) => (
              <div key={`e-${i}`} className="flex items-start gap-2 text-sm">
                <AlertCircle size={15} className="mt-0.5 shrink-0 text-red-400" />
                <span className="text-red-400">{issue.message}</span>
              </div>
            ))}
            {warnings.map((issue, i) => (
              <div key={`w-${i}`} className="flex items-start gap-2 text-sm">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
                <span className="text-amber-400">{issue.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Record Type', value: recordLabel },
          { label: 'Rows', value: result.rowCount.toLocaleString() },
          { label: 'Columns', value: String(result.columnCount) },
          { label: 'File', value: result.fileName },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-[#262626] bg-[#111111] px-4 py-3">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="mt-0.5 truncate text-sm font-medium text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Data preview */}
      {previewHeaders.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-medium text-gray-400">Preview (first 5 rows)</h3>
          <div className="overflow-x-auto rounded-lg border border-[#262626]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#262626] bg-[#111111]">
                  {previewHeaders.map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-2 font-medium text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-[#1a1a1a]">
                    {row.map((cell, ci) => (
                      <td key={ci} className="max-w-[160px] truncate whitespace-nowrap px-3 py-2 text-gray-300">
                        {cell || <span className="text-gray-600">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1a1a1a] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#222]"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <button
            onClick={onStartOver}
            className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#1a1a1a] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#222]"
          >
            <RotateCcw size={16} />
            Start Over
          </button>
        </div>
        <ExportDropdown
          disabled={hasErrors}
          options={[
            {
              label: 'CSV (.csv)',
              icon: FileText,
              onClick: () => downloadCsv(result.csvContent, result.fileName),
            },
            {
              label: 'Excel (.xlsx)',
              icon: FileSpreadsheet,
              onClick: () => generateWorkbenchXlsx(rows, mappings, recordType, profiles),
            },
          ]}
        />
      </div>
    </div>
  );
}
