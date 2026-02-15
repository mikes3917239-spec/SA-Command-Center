import { useState } from 'react';
import { useDemoAccounts } from '@/hooks/useDemoAccounts';
import { DemoAccountForm } from './DemoAccountForm';
import { Plus, Monitor, Trash2, Wifi, Loader2 } from 'lucide-react';
import { DEMO_ENVIRONMENTS, DEMO_STATUSES } from '@/types';
import { checkConnection } from '@/lib/connection-checker';
import type { DemoAccount, DemoEnvironment, DemoStatus } from '@/types';

const STATUS_CYCLE: DemoStatus[] = ['unknown', 'connected', 'disconnected'];

function relativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function DemoSelectorPage() {
  const { accounts, loading, createAccount, updateAccount, deleteAccount } = useDemoAccounts();
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<DemoAccount | null>(null);
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  const handleSave = async (data: {
    name: string;
    description: string;
    environment: DemoEnvironment;
    accountId: string;
    suiteAppUrl: string;
    status: DemoStatus;
  }) => {
    if (editingAccount) {
      await updateAccount(editingAccount.id, data);
    } else {
      await createAccount(data);
    }
  };

  const handleCheck = async (account: DemoAccount) => {
    if (checkingIds.has(account.id) || !account.suiteAppUrl) return;

    setCheckingIds((prev) => new Set(prev).add(account.id));
    try {
      const ok = await checkConnection(account.suiteAppUrl);
      await updateAccount(account.id, {
        status: ok ? 'connected' : 'disconnected',
        lastChecked: new Date(),
      });
    } finally {
      setCheckingIds((prev) => {
        const next = new Set(prev);
        next.delete(account.id);
        return next;
      });
    }
  };

  const handleStatusToggle = async (account: DemoAccount) => {
    const currentIdx = STATUS_CYCLE.indexOf(account.status);
    const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];
    await updateAccount(account.id, { status: nextStatus });
  };

  const openCreate = () => {
    setEditingAccount(null);
    setShowForm(true);
  };

  const openEdit = (account: DemoAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-[#1a1a1a]" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Demo Accounts</h1>
          <p className="mt-1 text-sm text-gray-400">
            {accounts.length} account{accounts.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
        >
          <Plus size={16} />
          Add Account
        </button>
      </div>

      {/* Account List */}
      {accounts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[#262626] bg-[#111111] py-16">
          <Monitor size={48} className="mb-4 text-gray-600" />
          <p className="text-gray-400">No Demo Accounts Configured</p>
          <button
            onClick={openCreate}
            className="mt-4 text-sm text-emerald-400 hover:underline"
          >
            Add your first demo account
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {accounts.map((account) => {
            const envInfo = DEMO_ENVIRONMENTS.find((e) => e.value === account.environment);
            const statusInfo = DEMO_STATUSES.find((s) => s.value === account.status);
            const isChecking = checkingIds.has(account.id);
            return (
              <div
                key={account.id}
                onClick={() => openEdit(account)}
                className="group flex cursor-pointer items-start justify-between rounded-xl border border-[#262626] bg-[#111111] p-4 transition hover:border-[#333]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    {/* Status dot */}
                    <span
                      className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: statusInfo?.color || '#6b7280' }}
                      title={statusInfo?.label || 'Unknown'}
                    />
                    <h3 className="truncate font-medium text-white">{account.name}</h3>
                    {envInfo && (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: envInfo.color + '20',
                          color: envInfo.color,
                        }}
                      >
                        {envInfo.label}
                      </span>
                    )}
                  </div>
                  {account.description && (
                    <p className="mt-1 truncate text-sm text-gray-400">{account.description}</p>
                  )}
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                    <span>ID: {account.accountId}</span>
                    {account.lastChecked && (
                      <span>Checked {relativeTime(account.lastChecked)}</span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="ml-4 flex items-center gap-2">
                  {/* Check Connection button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheck(account);
                    }}
                    disabled={isChecking || !account.suiteAppUrl}
                    className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#1a1a1a] px-2.5 py-1.5 text-xs text-gray-300 transition hover:bg-[#222] disabled:opacity-40"
                    title={account.suiteAppUrl ? 'Check connection' : 'No SuiteApp URL configured'}
                  >
                    {isChecking ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Wifi size={14} />
                    )}
                    Check
                  </button>

                  {/* Status toggle button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusToggle(account);
                    }}
                    className="flex items-center gap-1.5 rounded-lg border border-[#262626] bg-[#1a1a1a] px-2.5 py-1.5 text-xs transition hover:bg-[#222]"
                    style={{ color: statusInfo?.color || '#6b7280' }}
                    title="Click to cycle status"
                  >
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: statusInfo?.color || '#6b7280' }}
                    />
                    {statusInfo?.label || 'Unknown'}
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this demo account?')) {
                        deleteAccount(account.id);
                      }
                    }}
                    className="rounded p-1 text-gray-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <DemoAccountForm
          account={editingAccount}
          onSave={handleSave}
          onClose={closeForm}
        />
      )}
    </div>
  );
}
