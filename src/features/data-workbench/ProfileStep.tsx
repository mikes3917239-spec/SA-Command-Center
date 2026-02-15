import { FileSpreadsheet, ArrowLeft, ArrowRight } from 'lucide-react';
import type { ColumnProfile } from '@/types';

const TYPE_COLORS: Record<string, string> = {
  string: 'bg-blue-500/15 text-blue-400',
  number: 'bg-purple-500/15 text-purple-400',
  date: 'bg-amber-500/15 text-amber-400',
  boolean: 'bg-cyan-500/15 text-cyan-400',
  email: 'bg-emerald-500/15 text-emerald-400',
  phone: 'bg-pink-500/15 text-pink-400',
  currency: 'bg-green-500/15 text-green-400',
  mixed: 'bg-gray-500/15 text-gray-400',
};

interface ProfileStepProps {
  fileName: string;
  profiles: ColumnProfile[];
  rowCount: number;
  onBack: () => void;
  onNext: () => void;
}

export function ProfileStep({ fileName, profiles, rowCount, onBack, onNext }: ProfileStepProps) {
  return (
    <div>
      {/* Summary bar */}
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-[#262626] bg-[#111111] px-5 py-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet size={18} className="text-emerald-400" />
          <span className="text-sm font-medium text-white">{fileName}</span>
        </div>
        <div className="flex gap-4 text-xs text-gray-400">
          <span>
            <strong className="text-white">{profiles.length}</strong> columns
          </span>
          <span>
            <strong className="text-white">{rowCount.toLocaleString()}</strong> rows
          </span>
        </div>
      </div>

      {/* Profile table */}
      <div className="overflow-x-auto rounded-lg border border-[#262626]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#262626] bg-[#111111]">
              <th className="px-4 py-3 font-medium text-gray-400">Column</th>
              <th className="px-4 py-3 font-medium text-gray-400">Type</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">Non-Null</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">Unique</th>
              <th className="px-4 py-3 font-medium text-gray-400 text-right">Duplicates</th>
              <th className="px-4 py-3 font-medium text-gray-400">Min / Max</th>
              <th className="px-4 py-3 font-medium text-gray-400">Samples</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((col) => (
              <tr key={col.name} className="border-b border-[#1a1a1a] hover:bg-[#111111]">
                <td className="px-4 py-2.5 font-medium text-white">{col.name}</td>
                <td className="px-4 py-2.5">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[col.detectedType] || TYPE_COLORS.mixed}`}
                  >
                    {col.detectedType}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-300">
                  {col.nonNullCount}
                  <span className="text-gray-500">/{rowCount}</span>
                </td>
                <td className="px-4 py-2.5 text-right text-gray-300">{col.uniqueCount}</td>
                <td className="px-4 py-2.5 text-right text-gray-300">{col.duplicateCount}</td>
                <td className="px-4 py-2.5 text-xs text-gray-400">
                  {col.min != null && col.max != null ? (
                    <>
                      <span className="text-gray-300">{col.min}</span>
                      <span className="mx-1">—</span>
                      <span className="text-gray-300">{col.max}</span>
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-gray-500">
                  {col.sampleValues.slice(0, 3).join(', ')}
                </td>
              </tr>
            ))}
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
          Continue to Mapping
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
