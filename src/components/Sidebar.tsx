import { NavLink } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/features/auth/auth-store';
import {
  LayoutDashboard,
  StickyNote,
  Monitor,
  FileText,
  Database,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { create } from 'zustand';

interface SidebarState {
  collapsed: boolean;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  collapsed: false,
  toggle: () => set((s) => ({ collapsed: !s.collapsed })),
}));

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notes', icon: StickyNote, label: 'Notes' },
  { to: '/demo-selector', icon: Monitor, label: 'Demo Selector' },
  { to: '/agendas', icon: FileText, label: 'Agendas' },
  { to: '/data-workbench', icon: Database, label: 'Data Workbench' },
];

export function Sidebar() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <aside
      className={`flex h-screen flex-col border-r border-[#262626] bg-[#111111] transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-[#262626] px-3">
        {!collapsed && (
          <span className="text-sm font-bold tracking-wide text-emerald-400">
            SA Command Center
          </span>
        )}
        <button
          onClick={toggle}
          className="rounded p-1 text-gray-400 hover:bg-[#1a1a1a] hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                isActive
                  ? 'bg-emerald-600/15 text-emerald-400'
                  : 'text-gray-400 hover:bg-[#1a1a1a] hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User / Logout */}
      <div className="border-t border-[#262626] p-2">
        {user && !collapsed && (
          <div className="mb-2 flex items-center gap-2 px-3 py-1">
            {user.photoURL && (
              <img
                src={user.photoURL}
                alt=""
                className="h-6 w-6 rounded-full"
              />
            )}
            <span className="truncate text-xs text-gray-400">
              {user.displayName || user.email}
            </span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 transition hover:bg-[#1a1a1a] hover:text-red-400"
        >
          <LogOut size={18} />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
