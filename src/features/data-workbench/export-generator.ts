import Papa from 'papaparse';
import type { FieldMapping, NetSuiteRecordType, ExportResult, ValidationIssue } from '@/types';
import { getRequiredFields, getFieldsForRecordType } from './netsuite-fields';

const TRANSFORMS: Record<string, (val: string) => string> = {
  none: (v) => v,
  uppercase: (v) => v.toUpperCase(),
  lowercase: (v) => v.toLowerCase(),
  trim: (v) => v.trim(),
  'trim-uppercase': (v) => v.trim().toUpperCase(),
  'trim-lowercase': (v) => v.trim().toLowerCase(),
  'date-mm/dd/yyyy': (v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
  },
  'date-yyyy-mm-dd': (v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return v;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  },
  'number-clean': (v) => v.replace(/[^0-9.-]/g, ''),
  'boolean-tf': (v) => {
    const lower = v.toLowerCase().trim();
    if (['yes', 'y', '1', 'true', 't'].includes(lower)) return 'T';
    if (['no', 'n', '0', 'false', 'f'].includes(lower)) return 'F';
    return v;
  },
};

export const TRANSFORM_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'uppercase', label: 'UPPERCASE' },
  { value: 'lowercase', label: 'lowercase' },
  { value: 'trim', label: 'Trim whitespace' },
  { value: 'trim-uppercase', label: 'Trim + UPPERCASE' },
  { value: 'trim-lowercase', label: 'Trim + lowercase' },
  { value: 'date-mm/dd/yyyy', label: 'Date MM/DD/YYYY' },
  { value: 'date-yyyy-mm-dd', label: 'Date YYYY-MM-DD' },
  { value: 'number-clean', label: 'Clean number' },
  { value: 'boolean-tf', label: 'Boolean T/F' },
];

export function generateExport(
  rows: Record<string, string>[],
  mappings: FieldMapping[],
  recordType: NetSuiteRecordType
): ExportResult {
  const issues: ValidationIssue[] = [];
  const activeMappings = mappings.filter((m) => m.targetField);

  // Validate: required fields
  const requiredFields = getRequiredFields(recordType);
  const mappedTargets = new Set(activeMappings.map((m) => m.targetField));
  for (const field of requiredFields) {
    if (!mappedTargets.has(field.fieldId)) {
      issues.push({
        type: 'error',
        message: `Required field "${field.label}" is not mapped`,
      });
    }
  }

  // Validate: unmapped source columns
  const allFields = getFieldsForRecordType(recordType);
  const sourceHeaders = Object.keys(rows[0] || {});
  const mappedSources = new Set(activeMappings.map((m) => m.sourceColumn));
  const unmappedSources = sourceHeaders.filter((h) => !mappedSources.has(h));
  if (unmappedSources.length > 0) {
    issues.push({
      type: 'warning',
      message: `${unmappedSources.length} source column(s) not mapped: ${unmappedSources.slice(0, 3).join(', ')}${unmappedSources.length > 3 ? '...' : ''}`,
    });
  }

  // Validate: no mappings at all
  if (activeMappings.length === 0) {
    issues.push({
      type: 'error',
      message: 'No columns are mapped',
    });
  }

  // Build output headers (NetSuite field labels)
  const outputHeaders = activeMappings.map((m) => {
    const field = allFields.find((f) => f.fieldId === m.targetField);
    return field?.label || m.targetField;
  });

  // Remap and transform rows
  const outputRows = rows.map((row) =>
    activeMappings.map((m) => {
      const raw = row[m.sourceColumn] ?? '';
      const transformFn = TRANSFORMS[m.transform || 'none'] || TRANSFORMS.none;
      return transformFn(raw);
    })
  );

  // Check for empty required values in data
  for (const field of requiredFields) {
    const mapping = activeMappings.find((m) => m.targetField === field.fieldId);
    if (mapping) {
      const emptyCount = rows.filter((r) => !(r[mapping.sourceColumn] ?? '').trim()).length;
      if (emptyCount > 0) {
        issues.push({
          type: 'warning',
          message: `Required field "${field.label}" has ${emptyCount} empty value(s)`,
        });
      }
    }
  }

  const csvContent = Papa.unparse({
    fields: outputHeaders,
    data: outputRows,
  });

  const label = recordType.replace(/([A-Z])/g, '-$1').toLowerCase();
  const fileName = `netsuite-${label}-import-${Date.now()}.csv`;

  return {
    csvContent,
    fileName,
    rowCount: outputRows.length,
    columnCount: outputHeaders.length,
    issues,
  };
}

export function downloadCsv(content: string, fileName: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
