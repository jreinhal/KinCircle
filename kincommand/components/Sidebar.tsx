import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  ShieldAlert,
  Briefcase,
  Settings,
  MessageSquare,
  Repeat,
  X,
  CalendarCheck,
  Zap
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
  const menuItems = [
    { id: 'dashboard', label: 'Sibling Ledger', icon: LayoutDashboard },
    { id: 'schedule', label: 'Care Schedule', icon: CalendarCheck },
    { id: 'add-entry', label: 'Add Entry', icon: PlusCircle },
    { id: 'chat', label: 'Ask Kin', icon: MessageSquare },
    { id: 'entries', label: 'All Transactions', icon: FileText },
    // { id: 'medicaid', label: 'Medicaid Audit', icon: ShieldAlert }, // Moved to Reports (Future)
    { id: 'vault', label: 'Digital Vault', icon: Briefcase },
    // Agent Lab hidden from main menu (accessible via debug: Shift+Click logo 3x)
  ];

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
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
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
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                ${activeTab === item.id
                  ? 'bg-accent text-white shadow-lg shadow-blue-900/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4 bg-slate-900">
          <button
            onClick={() => handleNav('settings')}
            className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium
                ${activeTab === 'settings'
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>

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