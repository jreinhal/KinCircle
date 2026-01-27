import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  Briefcase,
  Settings,
  MessageSquare,
  Repeat,
  X,
  CalendarCheck,
  Users,
  Pill,
  HandHelping,
  RefreshCw,
  ChevronDown,
  SlidersHorizontal
} from 'lucide-react';
import { User } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  currentUser: User;
  onSwitchUser: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen,
  setIsMobileOpen,
  currentUser,
  onSwitchUser
}) => {
  const primaryItems = [
    { id: 'dashboard', label: 'Care Ledger', icon: LayoutDashboard },
    { id: 'schedule', label: 'Care Tasks', icon: CalendarCheck },
    { id: 'help-calendar', label: 'Help Calendar', icon: HandHelping },
    { id: 'add-entry', label: 'Add Entry', icon: PlusCircle },
    { id: 'medications', label: 'Medications', icon: Pill },
    { id: 'chat', label: 'Ask Kin (AI)', icon: MessageSquare },
  ];

  const secondaryItems = [
    { id: 'entries', label: 'Ledger & Reports', icon: FileText },
    { id: 'recurring', label: 'Recurring Expenses', icon: RefreshCw },
    { id: 'vault', label: 'Document Vault', icon: Briefcase },
    { id: 'family', label: 'Family Circle', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const secondaryIds = new Set(secondaryItems.map(item => item.id));
  const isSecondaryActive = secondaryIds.has(activeTab);
  const [isToolsOpen, setIsToolsOpen] = useState(isSecondaryActive);

  useEffect(() => {
    if (isSecondaryActive) {
      setIsToolsOpen(true);
    }
  }, [isSecondaryActive]);

  const handleNav = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0 flex flex-col
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <span className="font-bold text-white">K</span>
            </div>
            <span className="text-xl font-bold tracking-tight">KinCircle</span>
          </div>
          <button onClick={() => setIsMobileOpen(false)} className="md:hidden">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-2 px-4 space-y-2 flex-1 overflow-y-auto">
          {primaryItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium border-l-2
                ${activeTab === item.id
                  ? 'bg-accent text-white shadow-lg shadow-blue-900/20 border-white/80'
                  : 'text-slate-400 border-transparent hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsToolsOpen((prev) => !prev)}
            className={`
              w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium border-l-2
              ${isSecondaryActive
                ? 'bg-slate-800 text-white border-white/60'
                : 'text-slate-300 border-transparent hover:bg-slate-800 hover:text-white'}
            `}
            aria-expanded={isToolsOpen}
          >
            <SlidersHorizontal size={18} />
            <span>Tools & Settings</span>
            <ChevronDown size={18} className={`ml-auto transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${isToolsOpen ? 'rotate-180' : ''}`} />
          </button>

          <div
            className={`space-y-1 pl-3 overflow-hidden origin-top transition-[max-height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[max-height] ${
              isToolsOpen ? 'max-h-96' : 'max-h-0 pointer-events-none'
            }`}
            style={{ transitionDelay: isToolsOpen ? '0ms' : `${(secondaryItems.length - 1) * 65}ms` }}
            aria-hidden={!isToolsOpen}
          >
              {secondaryItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleNav(item.id)}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium border-l-2
                    transition-[color,background-color,border-color,transform,opacity] duration-200 ease-out
                    ${isToolsOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
                    ${activeTab === item.id
                      ? 'bg-slate-800 text-white border-slate-200'
                      : 'text-slate-400 border-transparent hover:bg-slate-800/70 hover:text-white'}
                  `}
                  style={{
                    transitionDelay: `${(isToolsOpen ? idx : (secondaryItems.length - 1 - idx)) * 65}ms`
                  }}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </button>
              ))}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-900">
          {/* User Switcher */}
          <button
            onClick={onSwitchUser}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 transition-colors group"
            title="Click to switch user"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold border-2 border-slate-700">
                {currentUser.name.charAt(0)}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-white">{currentUser.name.split(' ')[0]}</p>
                <p className="text-xs text-slate-500">{currentUser.role === 'ADMIN' ? 'Family Admin' : 'Contributor'}</p>
              </div>
            </div>
            <Repeat size={16} className="text-slate-600 group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
