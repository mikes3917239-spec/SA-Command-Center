import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { DEMO_ENVIRONMENTS, DEMO_STATUSES } from '@/types';
import type { DemoAccount, DemoEnvironment, DemoStatus } from '@/types';

interface DemoAccountFormProps {
  account?: DemoAccount | null;
  onSave: (data: {
    name: string;
    description: string;
    environment: DemoEnvironment;
    accountId: string;
    suiteAppUrl: string;
    status: DemoStatus;
  }) => Promise<void>;
  onClose: () => void;
}

export function DemoAccountForm({ account, onSave, onClose }: DemoAccountFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [environment, setEnvironment] = useState<DemoEnvironment>('sandbox');
  const [accountId, setAccountId] = useState('');
  const [suiteAppUrl, setSuiteAppUrl] = useState('');
  const [status, setStatus] = useState<DemoStatus>('unknown');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (account) {
      setName(account.name);
      setDescription(account.description);
      setEnvironment(account.environment);
      setAccountId(account.accountId);
      setSuiteAppUrl(account.suiteAppUrl);
      setStatus(account.status);
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({ name, description, environment, accountId, suiteAppUrl, status });
      onClose();
    } catch (err) {
      console.error('Failed to save account:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg rounded-xl border border-[#262626] bg-[#111111] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">
            {account ? 'Edit Account' : 'Add Demo Account'}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. TSTDRV123456"
              className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this account used for?"
              className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as DemoEnvironment)}
              className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
            >
              {DEMO_ENVIRONMENTS.map((env) => (
                <option key={env.value} value={env.value}>
                  {env.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as DemoStatus)}
              className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none"
            >
              {DEMO_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">Account ID</label>
            <input
              type="text"
              required
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="e.g. TSTDRV2345678"
              className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">SuiteApp URL</label>
            <input
              type="url"
              value={suiteAppUrl}
              onChange={(e) => setSuiteAppUrl(e.target.value)}
              placeholder="https://system.netsuite.com/..."
              className="w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#262626] px-4 py-2 text-sm text-gray-300 transition hover:bg-[#1a1a1a]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : account ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
