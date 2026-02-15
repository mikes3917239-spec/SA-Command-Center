import { Database } from 'lucide-react';

export function DataWorkbenchPage() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Database size={48} className="mb-4 text-gray-600" />
      <h1 className="text-xl font-bold text-white">Data Workbench</h1>
      <p className="mt-2 text-sm text-gray-400">
        Upload, profile, and map data for NetSuite — coming in Phase 4.
      </p>
    </div>
  );
}
