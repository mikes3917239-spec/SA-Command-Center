import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAgendas } from '@/hooks/useAgendas';
import { getDefaultSections, US_TIMEZONES } from './agenda-presets';
import { AgendaPreview } from './AgendaPreview';
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  GripVertical,
  X,
} from 'lucide-react';
import type { AgendaStatus, TeamMember, AgendaSection } from '@/types';

function newMember(): TeamMember {
  return { id: crypto.randomUUID(), name: '', role: '', email: '' };
}

function computeTimeSlots(sections: AgendaSection[], startTime: string): AgendaSection[] {
  if (!startTime) return sections;

  const [hours, minutes] = startTime.split(':').map(Number);
  let cumulative = hours * 60 + minutes;

  return sections.map((s) => {
    if (!s.enabled) return { ...s, timeSlot: '' };
    const startH = Math.floor(cumulative / 60) % 24;
    const startM = cumulative % 60;
    const endTotal = cumulative + s.duration;
    const endH = Math.floor(endTotal / 60) % 24;
    const endM = endTotal % 60;

    const fmt = (h: number, m: number) => {
      const period = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
    };

    cumulative = endTotal;
    return { ...s, timeSlot: `${fmt(startH, startM)} - ${fmt(endH, endM)}` };
  });
}

export function AgendaBuilderPage() {
  const { agendaId } = useParams();
  const navigate = useNavigate();
  const { agendas, loading, createAgenda, updateAgenda, deleteAgenda } = useAgendas();
  const isNew = agendaId === 'new';

  const existingAgenda = useMemo(
    () => (isNew ? null : agendas.find((a) => a.id === agendaId)),
    [isNew, agendaId, agendas]
  );

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [timezone, setTimezone] = useState('America/New_York');
  const [status, setStatus] = useState<AgendaStatus>('draft');
  const [customerTeam, setCustomerTeam] = useState<TeamMember[]>([newMember()]);
  const [netsuiteTeam, setNetsuiteTeam] = useState<TeamMember[]>([newMember()]);
  const [sections, setSections] = useState<AgendaSection[]>(getDefaultSections());
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Accordion state
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    info: true,
    customerTeam: false,
    netsuiteTeam: false,
    sections: true,
    preview: false,
  });

  const togglePanel = (key: string) =>
    setOpenPanels((prev) => ({ ...prev, [key]: !prev[key] }));

  // Load existing agenda
  useEffect(() => {
    if (initialized) return;
    if (isNew) {
      setInitialized(true);
      return;
    }
    if (existingAgenda) {
      setCustomerName(existingAgenda.customerName);
      setTitle(existingAgenda.title || `NetSuite Software Demonstration for ${existingAgenda.customerName}`);
      setDateTime(existingAgenda.dateTime);
      setTimezone(existingAgenda.timezone);
      setStatus(existingAgenda.status);
      setCustomerTeam(
        existingAgenda.customerTeam.length > 0 ? existingAgenda.customerTeam : [newMember()]
      );
      setNetsuiteTeam(
        existingAgenda.netsuiteTeam.length > 0 ? existingAgenda.netsuiteTeam : [newMember()]
      );
      setSections(
        existingAgenda.sections.length > 0 ? existingAgenda.sections : getDefaultSections()
      );
      // Extract start time from dateTime
      if (existingAgenda.dateTime) {
        const d = new Date(existingAgenda.dateTime);
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        setStartTime(`${h}:${m}`);
      }
      setInitialized(true);
    }
  }, [isNew, existingAgenda, initialized]);

  const defaultTitle = (name: string) => `NetSuite Software Demonstration for ${name}`;

  const handleCustomerNameChange = (name: string) => {
    // Auto-update title if it still matches the default pattern
    if (!title || title === defaultTitle(customerName)) {
      setTitle(defaultTitle(name));
    }
    setCustomerName(name);
  };

  // Recompute time slots when start time or sections change
  const sectionsWithSlots = useMemo(
    () => computeTimeSlots(sections, startTime),
    [sections, startTime]
  );

  const agendaData = useMemo(
    () => ({
      id: agendaId || 'new',
      userId: '',
      customerName,
      title: title || defaultTitle(customerName),
      dateTime,
      timezone,
      customerTeam: customerTeam.filter((m) => m.name.trim()),
      netsuiteTeam: netsuiteTeam.filter((m) => m.name.trim()),
      sections: sectionsWithSlots,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    [agendaId, customerName, title, dateTime, timezone, customerTeam, netsuiteTeam, sectionsWithSlots, status]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        customerName,
        title: title || defaultTitle(customerName),
        dateTime,
        timezone,
        customerTeam: customerTeam.filter((m) => m.name.trim()),
        netsuiteTeam: netsuiteTeam.filter((m) => m.name.trim()),
        sections: sectionsWithSlots,
        status,
      };
      if (isNew) {
        const id = await createAgenda(payload);
        navigate(`/agendas/${id}`, { replace: true });
      } else if (agendaId) {
        await updateAgenda(agendaId, payload);
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [
    isNew, agendaId, customerName, title, dateTime, timezone,
    customerTeam, netsuiteTeam, sectionsWithSlots, status,
    createAgenda, updateAgenda, navigate,
  ]);

  // Team member helpers
  const updateMember = (
    team: TeamMember[],
    setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>,
    id: string,
    field: keyof TeamMember,
    value: string
  ) => {
    setTeam(team.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const removeMember = (
    team: TeamMember[],
    setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>,
    id: string
  ) => {
    if (team.length <= 1) return;
    setTeam(team.filter((m) => m.id !== id));
  };

  // Section helpers
  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );
  };

  const updateSectionDuration = (id: string, duration: number) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, duration } : s))
    );
  };

  const updateSubItem = (sectionId: string, index: number, value: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, subItems: s.subItems.map((item, i) => (i === index ? value : item)) }
          : s
      )
    );
  };

  const addSubItem = (sectionId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, subItems: [...s.subItems, ''] } : s
      )
    );
  };

  const removeSubItem = (sectionId: string, index: number) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, subItems: s.subItems.filter((_, i) => i !== index) }
          : s
      )
    );
  };

  const addCustomSection = () => {
    setSections((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: 'Custom Section',
        timeSlot: '',
        duration: 15,
        subItems: [''],
        enabled: true,
        isCustom: true,
        order: prev.length,
      },
    ]);
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSectionTitle = (id: string, title: string) => {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)));
  };

  // Expanded sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const toggleSectionExpand = (id: string) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  if (!isNew && loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (!isNew && !existingAgenda && !loading) {
    return (
      <div className="py-20 text-center text-gray-400">
        Agenda not found.
        <button onClick={() => navigate('/agendas')} className="ml-2 text-emerald-400 hover:underline">
          Back to agendas
        </button>
      </div>
    );
  }

  const inputCls =
    'w-full rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none';
  const selectCls =
    'rounded-lg border border-[#262626] bg-[#1a1a1a] px-3 py-2 text-sm text-gray-300 focus:border-emerald-500 focus:outline-none';

  return (
    <div>
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/agendas')}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft size={16} />
          Back to Agendas
        </button>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AgendaStatus)}
            className={selectCls}
          >
            <option value="draft">Draft</option>
            <option value="final">Final</option>
          </select>
          {!isNew && (
            <button
              onClick={async () => {
                if (confirm('Delete this agenda? This cannot be undone.')) {
                  await deleteAgenda(agendaId!);
                  navigate('/agendas');
                }
              }}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {/* ── Customer Info Panel ── */}
        <AccordionPanel
          title="Customer Info"
          open={openPanels.info}
          onToggle={() => togglePanel('info')}
        >
          <div className="mb-3">
            <label className="mb-1 block text-xs text-gray-400">Agenda Title</label>
            <input
              type="text"
              placeholder="NetSuite Software Demonstration for ..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-gray-400">Customer Name</label>
              <input
                type="text"
                placeholder="e.g. Customer Name"
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Date</label>
              <input
                type="date"
                value={dateTime ? dateTime.split('T')[0] : ''}
                onChange={(e) => {
                  const date = e.target.value;
                  setDateTime(date ? `${date}T${startTime}` : '');
                }}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (dateTime) {
                    const date = dateTime.split('T')[0];
                    setDateTime(`${date}T${e.target.value}`);
                  }
                }}
                className={inputCls}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-400">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`w-full ${selectCls}`}
              >
                {US_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </AccordionPanel>

        {/* ── Customer Team Panel ── */}
        <AccordionPanel
          title={`Customer Team (${customerTeam.filter((m) => m.name.trim()).length})`}
          open={openPanels.customerTeam}
          onToggle={() => togglePanel('customerTeam')}
        >
          <TeamTable
            members={customerTeam}
            onChange={setCustomerTeam}
            updateMember={(id, field, val) => updateMember(customerTeam, setCustomerTeam, id, field, val)}
            removeMember={(id) => removeMember(customerTeam, setCustomerTeam, id)}
            addMember={() => setCustomerTeam([...customerTeam, newMember()])}
          />
        </AccordionPanel>

        {/* ── NetSuite Team Panel ── */}
        <AccordionPanel
          title={`NetSuite Team (${netsuiteTeam.filter((m) => m.name.trim()).length})`}
          open={openPanels.netsuiteTeam}
          onToggle={() => togglePanel('netsuiteTeam')}
        >
          <TeamTable
            members={netsuiteTeam}
            onChange={setNetsuiteTeam}
            updateMember={(id, field, val) => updateMember(netsuiteTeam, setNetsuiteTeam, id, field, val)}
            removeMember={(id) => removeMember(netsuiteTeam, setNetsuiteTeam, id)}
            addMember={() => setNetsuiteTeam([...netsuiteTeam, newMember()])}
          />
        </AccordionPanel>

        {/* ── Agenda Sections Panel ── */}
        <AccordionPanel
          title={`Agenda Sections (${sections.filter((s) => s.enabled).length} active)`}
          open={openPanels.sections}
          onToggle={() => togglePanel('sections')}
        >
          <div className="space-y-2">
            {sections.map((section) => {
              const computed = sectionsWithSlots.find((s) => s.id === section.id);
              const timeDisplay = computed?.timeSlot || `${section.duration} min`;
              return (
              <div
                key={section.id}
                className={`rounded-lg border ${
                  section.enabled ? 'border-[#262626] bg-[#0a0a0a]' : 'border-[#1a1a1a] bg-[#0a0a0a] opacity-50'
                } p-3`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="shrink-0 text-gray-600" />
                  <input
                    type="checkbox"
                    checked={section.enabled}
                    onChange={() => toggleSection(section.id)}
                    className="h-4 w-4 rounded border-gray-600 bg-[#1a1a1a] text-emerald-500 focus:ring-emerald-500"
                  />
                  {section.isCustom ? (
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                      className="flex-1 rounded border border-[#262626] bg-[#111111] px-2 py-1 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <span className="flex-1 text-sm font-medium text-white">{section.title}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    {timeDisplay}
                  </span>
                  <button
                    onClick={() => toggleSectionExpand(section.id)}
                    className="rounded p-1 text-gray-500 hover:text-white"
                  >
                    {expandedSections[section.id] ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  {section.isCustom && (
                    <button
                      onClick={() => removeSection(section.id)}
                      className="rounded p-1 text-gray-600 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {expandedSections[section.id] && (
                  <div className="mt-3 space-y-2 pl-8">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400">Duration (min):</label>
                      <input
                        type="number"
                        min={5}
                        step={5}
                        value={section.duration}
                        onChange={(e) =>
                          updateSectionDuration(section.id, parseInt(e.target.value) || 5)
                        }
                        className="w-20 rounded border border-[#262626] bg-[#111111] px-2 py-1 text-sm text-white focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-400">Sub-items:</label>
                      {section.subItems.map((item, i) => (
                        <div key={i} className="mb-1 flex items-center gap-1">
                          <span className="text-xs text-gray-600">&bull;</span>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => updateSubItem(section.id, i, e.target.value)}
                            className="flex-1 rounded border border-[#262626] bg-[#111111] px-2 py-1 text-xs text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none"
                            placeholder="Sub-item..."
                          />
                          <button
                            onClick={() => removeSubItem(section.id, i)}
                            className="rounded p-0.5 text-gray-600 hover:text-red-400"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addSubItem(section.id)}
                        className="mt-1 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        <Plus size={12} />
                        Add sub-item
                      </button>
                    </div>
                  </div>
                )}
              </div>
              );
            })}
            <button
              onClick={addCustomSection}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[#333] bg-[#0a0a0a] py-2.5 text-sm text-gray-400 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              <Plus size={14} />
              Add Custom Section
            </button>
          </div>
        </AccordionPanel>

        {/* ── Preview & Export Panel ── */}
        <AccordionPanel
          title="Preview & Export"
          open={openPanels.preview}
          onToggle={() => togglePanel('preview')}
        >
          <AgendaPreview agenda={agendaData} />
        </AccordionPanel>
      </div>
    </div>
  );
}

// ── Accordion Panel ────────────────────────────────────────
function AccordionPanel({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[#262626] bg-[#111111]">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-white">{title}</span>
        {open ? (
          <ChevronDown size={16} className="text-gray-400" />
        ) : (
          <ChevronRight size={16} className="text-gray-400" />
        )}
      </button>
      {open && <div className="border-t border-[#262626] px-4 py-4">{children}</div>}
    </div>
  );
}

// ── Team Table ─────────────────────────────────────────────
function TeamTable({
  members,
  onChange: _onChange,
  updateMember,
  removeMember,
  addMember,
}: {
  members: TeamMember[];
  onChange: React.Dispatch<React.SetStateAction<TeamMember[]>>;
  updateMember: (id: string, field: keyof TeamMember, value: string) => void;
  removeMember: (id: string) => void;
  addMember: () => void;
}) {
  const inputCls =
    'w-full rounded border border-[#262626] bg-[#0a0a0a] px-2 py-1.5 text-sm text-white placeholder-gray-600 focus:border-emerald-500 focus:outline-none';

  return (
    <div>
      <div className="mb-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-gray-400">
        <span>Name</span>
        <span>Role</span>
        <span>Email</span>
        <span className="w-7" />
      </div>
      {members.map((m) => (
        <div key={m.id} className="mb-1.5 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input
            type="text"
            placeholder="Name"
            value={m.name}
            onChange={(e) => updateMember(m.id, 'name', e.target.value)}
            className={inputCls}
          />
          <input
            type="text"
            placeholder="Role"
            value={m.role}
            onChange={(e) => updateMember(m.id, 'role', e.target.value)}
            className={inputCls}
          />
          <input
            type="email"
            placeholder="Email"
            value={m.email}
            onChange={(e) => updateMember(m.id, 'email', e.target.value)}
            className={inputCls}
          />
          <button
            onClick={() => removeMember(m.id)}
            className="flex w-7 items-center justify-center rounded text-gray-600 hover:text-red-400"
          >
            <X size={14} />
          </button>
        </div>
      ))}
      <button
        onClick={addMember}
        className="mt-2 flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
      >
        <Plus size={12} />
        Add Member
      </button>
    </div>
  );
}
