import type { ColumnProfile, DetectedColumnType, ValueFrequency } from '@/types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[\d\s()+-]{7,20}$/;
const CURRENCY_RE = /^[$€£¥]?\s?[\d,]+\.?\d*$|^[\d,]+\.?\d*\s?[$€£¥]$/;
const DATE_RE = /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}$/;
const BOOL_VALUES = new Set(['true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n']);

function detectType(values: string[]): DetectedColumnType {
  const nonEmpty = values.filter((v) => v.trim() !== '');
  if (nonEmpty.length === 0) return 'string';

  const threshold = 0.8;
  const total = nonEmpty.length;

  const counts: Record<string, number> = {
    number: 0,
    date: 0,
    boolean: 0,
    email: 0,
    phone: 0,
    currency: 0,
  };

  for (const val of nonEmpty) {
    const trimmed = val.trim();
    const lower = trimmed.toLowerCase();

    if (BOOL_VALUES.has(lower)) counts.boolean++;
    if (EMAIL_RE.test(trimmed)) counts.email++;
    if (PHONE_RE.test(trimmed) && !/^[\d.]+$/.test(trimmed)) counts.phone++;
    if (CURRENCY_RE.test(trimmed) && /[$€£¥]/.test(trimmed)) counts.currency++;
    if (DATE_RE.test(trimmed) || !isNaN(Date.parse(trimmed))) counts.date++;
    if (!isNaN(Number(trimmed)) && trimmed !== '') counts.number++;
  }

  // Priority order: email > currency > phone > boolean > date > number > string
  if (counts.email / total >= threshold) return 'email';
  if (counts.currency / total >= threshold) return 'currency';
  if (counts.phone / total >= threshold) return 'phone';
  if (counts.boolean / total >= threshold) return 'boolean';
  if (counts.date / total >= threshold) return 'date';
  if (counts.number / total >= threshold) return 'number';

  // If multiple types detected above 30%, it's mixed
  const aboveThreshold = Object.values(counts).filter((c) => c / total > 0.3);
  if (aboveThreshold.length > 1) return 'mixed';

  return 'string';
}

function getTopValues(values: string[], limit = 5): ValueFrequency[] {
  const freq = new Map<string, number>();
  for (const v of values) {
    if (v.trim() === '') continue;
    freq.set(v, (freq.get(v) || 0) + 1);
  }
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

function getMinMax(values: string[], type: DetectedColumnType): { min: string | null; max: string | null } {
  const nonEmpty = values.filter((v) => v.trim() !== '');
  if (nonEmpty.length === 0) return { min: null, max: null };

  if (type === 'number' || type === 'currency') {
    const nums = nonEmpty
      .map((v) => Number(v.replace(/[$€£¥,\s]/g, '')))
      .filter((n) => !isNaN(n));
    if (nums.length === 0) return { min: null, max: null };
    return { min: String(Math.min(...nums)), max: String(Math.max(...nums)) };
  }

  if (type === 'date') {
    const dates = nonEmpty
      .map((v) => new Date(v).getTime())
      .filter((d) => !isNaN(d));
    if (dates.length === 0) return { min: null, max: null };
    return {
      min: new Date(Math.min(...dates)).toLocaleDateString(),
      max: new Date(Math.max(...dates)).toLocaleDateString(),
    };
  }

  // String: alphabetical min/max
  const sorted = [...nonEmpty].sort();
  return { min: sorted[0], max: sorted[sorted.length - 1] };
}

export function profileData(headers: string[], rows: Record<string, string>[]): ColumnProfile[] {
  return headers.map((header) => {
    const values = rows.map((row) => row[header] ?? '');
    const nonEmpty = values.filter((v) => v.trim() !== '');
    const uniqueSet = new Set(nonEmpty);
    const detectedType = detectType(values);
    const { min, max } = getMinMax(values, detectedType);

    return {
      name: header,
      detectedType,
      nonNullCount: nonEmpty.length,
      nullCount: values.length - nonEmpty.length,
      uniqueCount: uniqueSet.size,
      duplicateCount: nonEmpty.length - uniqueSet.size,
      min,
      max,
      topValues: getTopValues(values),
      sampleValues: nonEmpty.slice(0, 5),
    };
  });
}
