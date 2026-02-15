import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from 'lucide-react';

interface UploadStepProps {
  onFileParsed: (fileName: string, headers: string[], rows: Record<string, string>[]) => void;
}

export function UploadStep({ onFileParsed }: UploadStepProps) {
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  const parseCSV = useCallback(
    (file: File) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete(results) {
          const headers = results.meta.fields || [];
          const rows = results.data as Record<string, string>[];
          if (headers.length === 0 || rows.length === 0) {
            setError('File appears to be empty or has no valid data.');
            setParsing(false);
            return;
          }
          setParsing(false);
          onFileParsed(file.name, headers, rows);
        },
        error(err) {
          setError(`CSV parse error: ${err.message}`);
          setParsing(false);
        },
      });
    },
    [onFileParsed]
  );

  const parseXLSX = useCallback(
    async (file: File) => {
      try {
        const raw = await readXlsxFile(file);

        if (raw.length < 2) {
          const preview = raw.length > 0
            ? `Row 0 (${raw[0].length} cells): ${raw[0].map((c) => String(c ?? 'null')).slice(0, 5).join(', ')}`
            : 'no rows returned';
          setError(`Parsed ${raw.length} row(s) — need at least 2. (${preview})`);
          setParsing(false);
          return;
        }

        const headers = raw[0].map((h) => String(h ?? '').trim()).filter(Boolean);
        if (headers.length === 0) {
          setError('Could not detect column headers in the first row.');
          setParsing(false);
          return;
        }

        const rows = raw.slice(1)
          .filter((r) => r.some((cell) => cell != null && String(cell).trim() !== ''))
          .map((r) => {
            const mapped: Record<string, string> = {};
            for (let c = 0; c < headers.length; c++) {
              const val = r[c];
              mapped[headers[c]] = val instanceof Date
                ? val.toLocaleDateString()
                : String(val ?? '');
            }
            return mapped;
          });

        if (rows.length === 0) {
          setError('Spreadsheet has headers but no data rows.');
          setParsing(false);
          return;
        }

        setParsing(false);
        onFileParsed(file.name, headers, rows);
      } catch (err) {
        setError(`Excel parse error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setParsing(false);
      }
    },
    [onFileParsed]
  );

  const onDrop = useCallback(
    (accepted: File[]) => {
      setError('');
      if (accepted.length === 0) return;
      const file = accepted[0];
      const ext = file.name.split('.').pop()?.toLowerCase();

      setParsing(true);
      if (ext === 'csv') {
        parseCSV(file);
      } else if (ext === 'xlsx' || ext === 'xls') {
        parseXLSX(file);
      } else {
        setError('Unsupported file type. Please upload a .csv, .xlsx, or .xls file.');
        setParsing(false);
      }
    },
    [parseCSV, parseXLSX]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false,
    disabled: parsing,
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 text-center">
        <h2 className="text-lg font-semibold text-white">Upload Your Data</h2>
        <p className="mt-1 text-sm text-gray-400">
          Upload a CSV or Excel file to begin profiling and mapping to NetSuite fields.
        </p>
      </div>

      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-xl border-2 border-dashed px-8 py-16 text-center transition ${
          isDragActive
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-[#333] bg-[#111111] hover:border-[#444] hover:bg-[#161616]'
        }`}
      >
        <input {...getInputProps()} />
        {parsing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-emerald-400" />
            <p className="text-sm text-gray-400">Parsing file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            {isDragActive ? (
              <Upload size={32} className="text-emerald-400" />
            ) : (
              <FileSpreadsheet size={32} className="text-gray-500" />
            )}
            <div>
              <p className="text-sm text-gray-300">
                {isDragActive ? 'Drop your file here...' : 'Drag & drop a file here, or click to browse'}
              </p>
              <p className="mt-1 text-xs text-gray-500">Supports .csv, .xlsx, .xls</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
          <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
