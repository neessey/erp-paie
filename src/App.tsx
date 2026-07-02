import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeDetail from './components/EmployeeDetail';
import PayrollManager from './components/PayrollManager';
import ActivityLogView from './components/ActivityLogView';
import Settings from './components/Settings';

import {
  Employee,
  MonthlyRecord,
  AppSettings,
  ActivityLog,
  Role,
  Notification,
} from './types';

import {
  INITIAL_EMPLOYEES,
  INITIAL_RECORDS,
  INITIAL_SETTINGS,
  INITIAL_LOGS,
} from './data/initialData';

import { Bell, Shield, Calendar, Clock, CheckCircle, Menu, LogOut } from 'lucide-react';
import {
  onAuthStateChanged,
  User as FirebaseUser,
  signOut as fbSignOut,
} from 'firebase/auth';
import {
  auth,
  seedDatabaseIfEmpty,
  dbGetEmployees,
  dbSaveEmployee,
  dbDeleteEmployee,
  dbGetRecords,
  dbSaveRecord,
  dbDeleteRecord,
  dbGetSettings,
  dbSaveSettings,
  dbGetLogs,
  dbSaveLog,
} from './firebase';
import Login from './components/Login';

export default function App() {
  // --- STATE WITH FIREBASE PERSISTENCE ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [records, setRecords] = useState<MonthlyRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  // Listen to Auth changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load data from Firebase on mount when user is authenticated
  useEffect(() => {
    if (!user) return;

    const currentUser = user;
    setIsLoading(true);
    async function loadData() {
      try {
        if (currentUser.uid === 'guest-admin') {
          // --- OFFLINE GUEST MODE: LOAD FROM LOCAL STORAGE ---
          const savedEmployees = localStorage.getItem('erp_employees');
          const savedRecords = localStorage.getItem('erp_records');
          const savedSettings = localStorage.getItem('erp_settings');
          const savedLogs = localStorage.getItem('erp_logs');

          setEmployees(savedEmployees ? JSON.parse(savedEmployees) : INITIAL_EMPLOYEES);
          setRecords(savedRecords ? JSON.parse(savedRecords) : INITIAL_RECORDS);
          setSettings(savedSettings ? JSON.parse(savedSettings) : INITIAL_SETTINGS);
          setLogs(savedLogs ? JSON.parse(savedLogs) : INITIAL_LOGS);
        } else {
          // --- CLOUD MODE: LOAD FROM FIRESTORE ---
          await seedDatabaseIfEmpty();
          const [empList, recList, appSettings, logList] = await Promise.all([
            dbGetEmployees(),
            dbGetRecords(),
            dbGetSettings(),
            dbGetLogs()
          ]);
          setEmployees(empList);
          setRecords(recList);
          setSettings(appSettings);
          setLogs(logList);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  // --- FIREBASE / LOCAL STORAGE WRITE WRAPPER HANDLERS ---
  const handleSetEmployees = (value: React.SetStateAction<Employee[]>) => {
    setEmployees((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (!isLoading) {
        if (user?.uid === 'guest-admin') {
          localStorage.setItem('erp_employees', JSON.stringify(next));
          
          // Delete associated records from local storage if any employees were deleted
          const deleted = prev.filter((p) => !next.some((n: Employee) => n.id === p.id));
          if (deleted.length > 0) {
            setRecords((prevRecs) => {
              const nextRecs = prevRecs.filter((r) => !deleted.some((emp) => r.employe_id === emp.id));
              localStorage.setItem('erp_records', JSON.stringify(nextRecs));
              return nextRecs;
            });
          }
        } else {
          // Find deleted
          const deleted = prev.filter((p) => !next.some((n: Employee) => n.id === p.id));
          deleted.forEach((emp) => {
            dbDeleteEmployee(emp.id);
            // Delete associated records as well
            const associatedRecords = records.filter((r) => r.employe_id === emp.id);
            associatedRecords.forEach((r) => dbDeleteRecord(r.id));
          });
          // Find added or updated
          next.forEach((emp: Employee) => {
            const prevEmp = prev.find((p) => p.id === emp.id);
            if (!prevEmp || JSON.stringify(prevEmp) !== JSON.stringify(emp)) {
              dbSaveEmployee(emp);
            }
          });
        }
      }
      return next;
    });
  };

  const handleSetRecords = (value: React.SetStateAction<MonthlyRecord[]>) => {
    setRecords((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (!isLoading) {
        if (user?.uid === 'guest-admin') {
          localStorage.setItem('erp_records', JSON.stringify(next));
        } else {
          // Find deleted
          const deleted = prev.filter((p) => !next.some((n: MonthlyRecord) => n.id === p.id));
          deleted.forEach((rec) => {
            dbDeleteRecord(rec.id);
          });
          // Find added or updated
          next.forEach((rec: MonthlyRecord) => {
            const prevRec = prev.find((p) => p.id === rec.id);
            if (!prevRec || JSON.stringify(prevRec) !== JSON.stringify(rec)) {
              dbSaveRecord(rec);
            }
          });
        }
      }
      return next;
    });
  };

  const handleSetSettings = (value: React.SetStateAction<AppSettings>) => {
    setSettings((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (!isLoading) {
        if (user?.uid === 'guest-admin') {
          localStorage.setItem('erp_settings', JSON.stringify(next));
        } else {
          dbSaveSettings(next);
        }
      }
      return next;
    });
  };

  const handleSetLogs = (value: React.SetStateAction<ActivityLog[]>) => {
    setLogs((prev) => {
      const next = typeof value === 'function' ? (value as Function)(prev) : value;
      if (!isLoading) {
        if (user?.uid === 'guest-admin') {
          localStorage.setItem('erp_logs', JSON.stringify(next));
        } else {
          // Find added logs
          next.forEach((log: ActivityLog) => {
            const prevLog = prev.find((p) => p.id === log.id);
            if (!prevLog) {
              dbSaveLog(log);
            }
          });
        }
      }
      return next;
    });
  };

  // Navigation states
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Core production role (Admin has full permissions across the entire app)
  const currentRole: Role = 'Admin';

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  // UTC Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Force clean light mode theme exclusively
    localStorage.setItem('erp_dark_mode', 'false');
    document.documentElement.classList.remove('dark');
  }, []);

  // UTC clock ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- AUTOMATED NOTIFICATIONS & ALERTS GENERATOR (Requirement 17) ---
  useEffect(() => {
    const alerts: Notification[] = [];

    // 1. Check salary changes
    records.forEach((rec) => {
      if (rec.mois === 6 && rec.annee === 2026) {
        const emp = employees.find((e) => e.id === rec.employe_id);
        if (!emp) return;

        const prevRec = records.find(
          (r) => r.employe_id === emp.id && r.mois === 5 && r.annee === 2026
        );
        if (prevRec && prevRec.salaire_net > 0) {
          const change = ((rec.salaire_net - prevRec.salaire_net) / prevRec.salaire_net) * 100;
          if (change >= 5) {
            alerts.push({
              id: `notif-prog-${rec.id}`,
              type: 'increase',
              title: '📈 Augmentation de Salaire Net',
              description: `Le salaire net de ${emp.prenom} ${emp.nom} affiche une hausse de +${Math.round(change)}% ce mois-ci.`,
              date: '2026-06-30T09:30:00Z',
              read: false,
              employe_id: emp.id,
            });
          } else if (change <= -5) {
            alerts.push({
              id: `notif-drop-${rec.id}`,
              type: 'decrease_alert',
              title: '⚠️ Baisse de Salaire Net détectée',
              description: `Le salaire net de ${emp.prenom} ${emp.nom} a diminué de ${Math.round(change)}% ce mois-ci.`,
              date: '2026-06-30T10:00:00Z',
              read: false,
              employe_id: emp.id,
            });
          }
        }
      }
    });

    // 2. Check for missing payroll sheets
    employees.forEach((emp) => {
      if (emp.statut === 'Actif') {
        const hasRec = records.some((r) => r.employe_id === emp.id && r.mois === 6 && r.annee === 2026);
        if (!hasRec) {
          alerts.push({
            id: `notif-missing-${emp.id}`,
            type: 'missing_alert',
            title: '📋 Fiche de paie manquante',
            description: `Aucune saisie de paie n'a été effectuée pour ${emp.prenom} ${emp.nom} pour le mois de juin 2026.`,
            date: '2026-06-30T08:00:00Z',
            read: false,
            employe_id: emp.id,
          });
        }
      }
    });

    setNotifications(alerts);
  }, [records, employees]);

  // --- GENERAL FUNCTIONS ---

  // Append new chronological log
  const handleAddLog = (action: string, details: string, prev?: string, next?: string) => {
    // Determine active name
    const activeName = user?.displayName || user?.email || 'Administrateur Local';

    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      utilisateur: activeName,
      role: 'Admin',
      action,
      details,
      date: new Date().toISOString(),
      ancienne_valeur: prev,
      nouvelle_valeur: next,
    };

    handleSetLogs((prevLogs) => [newLog, ...prevLogs]);
  };

  // Full database exporter
  const handleExportData = () => {
    const backupObj = {
      employees,
      records,
      settings,
      logs,
    };
    return JSON.stringify(backupObj, null, 2);
  };

  // Full database importer
  const handleImportData = (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (parsed.employees && parsed.records && parsed.settings && parsed.logs) {
        handleSetEmployees(parsed.employees);
        handleSetRecords(parsed.records);
        handleSetSettings(parsed.settings);
        handleSetLogs(parsed.logs);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  // Ledger-specific importer (e.g. Lean Distribution)
  const handleImportLedger = (importedEmployees: Employee[], importedRecords: MonthlyRecord[]) => {
    handleSetEmployees((prev) => {
      const merged = [...prev];
      importedEmployees.forEach((emp) => {
        const idx = merged.findIndex((e) => e.matricule === emp.matricule);
        if (idx > -1) {
          merged[idx] = { ...merged[idx], ...emp };
        } else {
          merged.push(emp);
        }
      });
      return merged;
    });

    handleSetRecords((prev) => {
      const merged = [...prev];
      importedRecords.forEach((rec) => {
        const idx = merged.findIndex((r) => r.id === rec.id);
        if (idx > -1) {
          merged[idx] = { ...merged[idx], ...rec };
        } else {
          merged.push(rec);
        }
      });
      return merged;
    });
  };

  // Count unread notifications
  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  // Navigate to employee details directly from notification click
  const handleNotificationClick = (notif: Notification) => {
    if (notif.employe_id) {
      const emp = employees.find((e) => e.id === notif.employe_id);
      if (emp) {
        setSelectedEmployee(emp);
        setCurrentTab('employees');
      }
    }
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    setShowNotificationsDropdown(false);
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 font-sans text-zinc-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-zinc-900">Vérification de la session...</h2>
        <p className="text-xs text-zinc-500 mt-1">Veuillez patienter...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onGuestLogin={() => {
          setIsLoading(true);
          setUser({
            uid: 'guest-admin',
            email: 'admin@innovatech.ci',
            displayName: 'Administrateur Local',
          } as any);
        }}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-50 font-sans text-zinc-800">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-semibold text-zinc-900">Chargement de l'ERP Paie...</h2>
        <p className="text-xs text-zinc-500 mt-1">Synchronisation sécurisée avec Firebase Firestore</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-800 overflow-hidden">
      {/* Sidebar navigation */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          // Automatically clear active employee focus when navigating to other sections
          if (tab !== 'employees') {
            setSelectedEmployee(null);
          }
        }}
        nomEntreprise={settings.nom_entreprise}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLogOut={() => fbSignOut(auth)}
      />

      {/* Main Content Area Container */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Universal Top Header */}
        <header className="h-16 border-b border-zinc-200 bg-white px-4 sm:px-8 flex items-center justify-between shrink-0 z-30">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Hamburger button for mobile menu */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 text-zinc-600 transition-colors"
              aria-label="Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Session status identity badge */}
            <div className="flex items-center gap-2 text-xs font-semibold bg-zinc-50 p-2 rounded-xl border border-zinc-200 max-w-[200px] sm:max-w-none overflow-hidden">
              <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="hidden sm:inline">Session :</span>
              <span className="text-blue-600 font-extrabold truncate" title={user?.email || 'Admin'}>
                {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
              </span>
            </div>

            {/* Time badge */}
            <div className="hidden sm:flex items-center gap-2 text-[11px] font-medium text-zinc-500">
              <Clock className="w-3.5 h-3.5" />
              <span className="font-mono">{currentTime.toLocaleTimeString('fr-FR')} (UTC)</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications Alert Dropdown Button */}
            <div className="relative">
              <button
                id="btn-notifications-bell"
                onClick={() => {
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                  if (!showNotificationsDropdown) {
                    markAllNotificationsAsRead();
                  }
                }}
                className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-xl border border-zinc-200 text-zinc-600 relative transition-colors"
                aria-label="Alertes RH"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-red-500 text-white font-extrabold text-[9px] flex items-center justify-center animate-pulse">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {/* Dropdown list */}
              {showNotificationsDropdown && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-zinc-200 rounded-2xl shadow-xl p-4 space-y-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <span className="font-bold text-zinc-900">Alertes & Notifications RH</span>
                    <span className="text-[10px] text-zinc-400">Automatique</span>
                  </div>

                  <div className="max-h-64 overflow-y-auto space-y-3 divide-y divide-zinc-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="pt-2.5 first:pt-0 cursor-pointer hover:bg-zinc-50 p-1.5 rounded-lg transition-colors space-y-1"
                      >
                        <p className="font-bold text-zinc-900">{notif.title}</p>
                        <p className="text-zinc-500 text-[11px] leading-relaxed">
                          {notif.description}
                        </p>
                      </div>
                    ))}

                    {notifications.length === 0 && (
                      <div className="py-6 text-center text-zinc-400 italic">
                        Aucune alerte RH à signaler pour ce mois.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile pill */}
            <div className="flex items-center gap-2">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Avatar"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-zinc-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-600 font-extrabold text-xs uppercase shrink-0">
                  {(user?.displayName || user?.email || 'A').charAt(0)}
                </div>
              )}
              <span className="text-xs font-semibold hidden md:inline text-zinc-700 max-w-[150px] truncate" title={user?.displayName || user?.email || undefined}>
                {user?.displayName || user?.email || 'Administrateur'}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable Content wrapper */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {/* Dashboard Tab */}
          {currentTab === 'dashboard' && (
            <Dashboard employees={employees} records={records} settings={settings} />
          )}

          {/* Employee Directory Tab (List or Detail) */}
          {currentTab === 'employees' &&
            (selectedEmployee ? (
              <EmployeeDetail
                employee={selectedEmployee}
                onBack={() => setSelectedEmployee(null)}
                records={records}
                setRecords={handleSetRecords}
                settings={settings}
                onAddLog={handleAddLog}
              />
            ) : (
              <EmployeeList
                employees={employees}
                setEmployees={handleSetEmployees}
                onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                onAddLog={handleAddLog}
                devise={settings.devise}
              />
            ))}

          {/* Monthly Payroll quick entry tab */}
          {currentTab === 'payroll' && (
            <PayrollManager
              employees={employees}
              setEmployees={handleSetEmployees}
              records={records}
              setRecords={handleSetRecords}
              settings={settings}
              onAddLog={handleAddLog}
            />
          )}

          {/* Activity Audit logs */}
          {currentTab === 'logs' && <ActivityLogView logs={logs} />}

          {/* Core settings Tab */}
          {currentTab === 'settings' && (
            <Settings
              settings={settings}
              setSettings={handleSetSettings}
              onImportData={handleImportData}
              onExportData={handleExportData}
              onAddLog={handleAddLog}
              onImportLedger={handleImportLedger}
            />
          )}
        </main>
      </div>
    </div>
  );
}
