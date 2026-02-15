import { Download } from 'lucide-react';
import { generateAgendaPdf } from './generate-agenda-pdf';
import type { Agenda } from '@/types';

interface Props {
  agenda: Agenda;
}

export function AgendaPreview({ agenda }: Props) {
  const enabledSections = agenda.sections.filter((s) => s.enabled);
  const title = agenda.title || `NetSuite Software Demonstration for ${agenda.customerName}`;

  const dateStr = agenda.dateTime
    ? new Date(agenda.dateTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const tzLabel = agenda.timezone
    ? agenda.timezone.replace('America/', '').replace('Pacific/', '').replace('_', ' ')
    : '';

  return (
    <div className="rounded-xl border border-[#262626] bg-[#0a0a0a] p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {dateStr && (
          <p className="mt-1 text-sm text-gray-400">
            {dateStr} ({tzLabel})
          </p>
        )}
      </div>

      {/* Customer Team */}
      {agenda.customerTeam.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">
            {agenda.customerName} Team
          </h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="pb-2 text-left font-medium text-gray-400">Name</th>
                <th className="pb-2 text-left font-medium text-gray-400">Role</th>
                <th className="pb-2 text-left font-medium text-gray-400">Email</th>
              </tr>
            </thead>
            <tbody>
              {agenda.customerTeam.map((m) => (
                <tr key={m.id} className="border-b border-[#1a1a1a]">
                  <td className="py-1.5 text-white">{m.name}</td>
                  <td className="py-1.5 text-gray-300">{m.role}</td>
                  <td className="py-1.5 text-gray-300">{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NetSuite Team */}
      {agenda.netsuiteTeam.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">NetSuite Team</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="pb-2 text-left font-medium text-gray-400">Name</th>
                <th className="pb-2 text-left font-medium text-gray-400">Role</th>
                <th className="pb-2 text-left font-medium text-gray-400">Email</th>
              </tr>
            </thead>
            <tbody>
              {agenda.netsuiteTeam.map((m) => (
                <tr key={m.id} className="border-b border-[#1a1a1a]">
                  <td className="py-1.5 text-white">{m.name}</td>
                  <td className="py-1.5 text-gray-300">{m.role}</td>
                  <td className="py-1.5 text-gray-300">{m.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agenda Table */}
      {enabledSections.length > 0 && (
        <div className="mb-6">
          <h3 className="mb-2 text-sm font-semibold text-emerald-400">Agenda</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="w-28 pb-2 text-left font-medium text-gray-400">Time</th>
                <th className="pb-2 text-left font-medium text-gray-400">Topic</th>
              </tr>
            </thead>
            <tbody>
              {enabledSections.map((section) => (
                <tr key={section.id} className="border-b border-[#1a1a1a] align-top">
                  <td className="py-2 text-gray-300">
                    {section.timeSlot || `${section.duration} min`}
                  </td>
                  <td className="py-2">
                    <p className="font-medium text-white">{section.title}</p>
                    {section.subItems.filter((s) => s.trim()).length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {section.subItems
                          .filter((s) => s.trim())
                          .map((item, i) => (
                            <li key={i} className="pl-4 text-xs text-gray-400">
                              &bull; {item}
                            </li>
                          ))}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Download button */}
      <div className="flex justify-center">
        <button
          onClick={() => generateAgendaPdf(agenda)}
          disabled={!agenda.customerName}
          className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
        >
          <Download size={16} />
          Download PDF
        </button>
      </div>
    </div>
  );
}
