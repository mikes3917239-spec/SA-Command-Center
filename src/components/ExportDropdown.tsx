import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ExportOption {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

interface ExportDropdownProps {
  options: ExportOption[];
  disabled?: boolean;
}

export function ExportDropdown({ options, disabled }: ExportDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
      >
        <Download size={16} />
        Export
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 min-w-[180px] rounded-lg border border-[#262626] bg-[#1a1a1a] py-1 shadow-xl">
          {options.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  setOpen(false);
                  opt.onClick();
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 text-sm text-gray-300 transition hover:bg-[#262626] hover:text-white"
              >
                <Icon size={15} />
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
