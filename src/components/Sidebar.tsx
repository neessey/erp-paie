import React from 'react';
import {
  Users,
  LayoutDashboard,
  Settings,
  Activity,
  FileSpreadsheet,
  X,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  nomEntreprise: string;
  isOpen: boolean;
  onClose: () => void;
  onLogOut: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  nomEntreprise,
  isOpen,
  onClose,
  onLogOut,
}: SidebarProps) {
  const tabs = [
    { id: 'dashboard', name: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'employees', name: 'Gestion Employés', icon: Users },
    { id: 'payroll', name: 'Saisie Mensuelle', icon: FileSpreadsheet },
    { id: 'logs', name: 'Journal d\'activité', icon: Activity },
    { id: 'settings', name: 'Paramètres', icon: Settings },
  ];

  const handleTabClick = (tabId: string) => {
    setCurrentTab(tabId);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r border-zinc-200 flex flex-col z-50 md:z-30 transition-transform duration-300 md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Section */}
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              ERP
            </div>
            <div className="overflow-hidden">
              <h1 className="font-semibold text-zinc-900 truncate text-sm">
                {nomEntreprise || 'PayRoll ERP'}
              </h1>
              <p className="text-xs text-zinc-400 truncate">
                Gestion & Performance
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <label className="text-[10px] font-medium tracking-wider uppercase text-zinc-400 block px-2 mb-2">
            Menu Principal
          </label>
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                id={`nav-tab-${tab.id}`}
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 font-semibold'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                }`}
              >
                <IconComponent className="w-4 h-4 shrink-0" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section: Connection status and details */}
        <div className="p-4 border-t border-zinc-100 space-y-3">
          <button
            id="btn-sidebar-logout"
            onClick={onLogOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Se déconnecter</span>
          </button>

          {/* Connection status line */}
          <div className="flex items-center justify-between text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-lg">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium">Synchro Cloud Active</span>
            </div>
            <span className="text-[10px] font-mono opacity-60">v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
