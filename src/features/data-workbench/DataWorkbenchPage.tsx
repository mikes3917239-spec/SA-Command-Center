import { useState, useCallback } from 'react';
import { Upload, BarChart3, GitBranch, Download, Check } from 'lucide-react';
import type { ColumnProfile, FieldMapping, NetSuiteRecordType, WorkbenchStep, MappingTemplate } from '@/types';
import { profileData } from './data-profiler';
import { useDataMappings } from '@/hooks/useDataMappings';
import { UploadStep } from './UploadStep';
import { ProfileStep } from './ProfileStep';
import { MappingStep } from './MappingStep';
import { ExportStep } from './ExportStep';

const STEPS: { key: WorkbenchStep; label: string; icon: typeof Upload }[] = [
  { key: 'upload', label: 'Upload', icon: Upload },
  { key: 'profile', label: 'Profile', icon: BarChart3 },
  { key: 'map', label: 'Map', icon: GitBranch },
  { key: 'export', label: 'Export', icon: Download },
];

const STEP_INDEX: Record<WorkbenchStep, number> = { upload: 0, profile: 1, map: 2, export: 3 };

export function DataWorkbenchPage() {
  const [step, setStep] = useState<WorkbenchStep>('upload');
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [profiles, setProfiles] = useState<ColumnProfile[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [recordType, setRecordType] = useState<NetSuiteRecordType>('customer');

  const { templates, loading: templatesLoading, createTemplate, deleteTemplate } = useDataMappings();

  const handleFileParsed = useCallback((name: string, hdrs: string[], data: Record<string, string>[]) => {
    setFileName(name);
    setHeaders(hdrs);
    setRows(data);
    const profiled = profileData(hdrs, data);
    setProfiles(profiled);
    setMappings(hdrs.map((h) => ({ sourceColumn: h, targetField: '', transform: 'none' })));
    setStep('profile');
  }, []);

  const handleRecordTypeChange = useCallback(
    (rt: NetSuiteRecordType) => {
      setRecordType(rt);
      // Clear target fields when record type changes (source columns stay)
      setMappings(headers.map((h) => ({ sourceColumn: h, targetField: '', transform: 'none' })));
    },
    [headers]
  );

  const handleSaveTemplate = useCallback(
    async (name: string) => {
      await createTemplate({ name, recordType, mappings });
    },
    [createTemplate, recordType, mappings]
  );

  const handleLoadTemplate = useCallback(
    (template: MappingTemplate) => {
      setRecordType(template.recordType);
      // Match template mappings to current headers
      const restored = headers.map((h) => {
        const existing = template.mappings.find((m) => m.sourceColumn === h);
        return existing || { sourceColumn: h, targetField: '', transform: 'none' };
      });
      setMappings(restored);
    },
    [headers]
  );

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      await deleteTemplate(id);
    },
    [deleteTemplate]
  );

  const reset = () => {
    setStep('upload');
    setFileName('');
    setHeaders([]);
    setRows([]);
    setProfiles([]);
    setMappings([]);
    setRecordType('customer');
  };

  const currentIndex = STEP_INDEX[step];

  return (
    <div>
      {/* Stepper bar */}
      <div className="mb-8 flex items-center justify-center gap-1">
        {STEPS.map((s, i) => {
          const isCompleted = i < currentIndex;
          const isCurrent = i === currentIndex;
          const isClickable = i < currentIndex;
          const Icon = s.icon;

          return (
            <div key={s.key} className="flex items-center">
              <button
                onClick={() => isClickable && setStep(s.key)}
                disabled={!isClickable}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  isCurrent
                    ? 'bg-emerald-600/15 font-medium text-emerald-400'
                    : isCompleted
                      ? 'cursor-pointer text-gray-300 hover:bg-[#1a1a1a]'
                      : 'cursor-default text-gray-600'
                }`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isCurrent
                      ? 'bg-emerald-600 text-white'
                      : isCompleted
                        ? 'bg-emerald-600/20 text-emerald-400'
                        : 'bg-[#1a1a1a] text-gray-600'
                  }`}
                >
                  {isCompleted ? <Check size={12} /> : <Icon size={12} />}
                </span>
                {s.label}
              </button>
              {i < STEPS.length - 1 && (
                <div
                  className={`mx-1 h-px w-8 ${i < currentIndex ? 'bg-emerald-600/40' : 'bg-[#262626]'}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {step === 'upload' && <UploadStep onFileParsed={handleFileParsed} />}

      {step === 'profile' && (
        <ProfileStep
          fileName={fileName}
          profiles={profiles}
          rowCount={rows.length}
          onBack={() => setStep('upload')}
          onNext={() => setStep('map')}
        />
      )}

      {step === 'map' && (
        <MappingStep
          profiles={profiles}
          rows={rows}
          mappings={mappings}
          recordType={recordType}
          templates={templates}
          templatesLoading={templatesLoading}
          onMappingsChange={setMappings}
          onRecordTypeChange={handleRecordTypeChange}
          onSaveTemplate={handleSaveTemplate}
          onLoadTemplate={handleLoadTemplate}
          onDeleteTemplate={handleDeleteTemplate}
          onBack={() => setStep('profile')}
          onNext={() => setStep('export')}
        />
      )}

      {step === 'export' && (
        <ExportStep
          rows={rows}
          mappings={mappings}
          recordType={recordType}
          onBack={() => setStep('map')}
          onStartOver={reset}
        />
      )}
    </div>
  );
}
