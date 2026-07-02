import React, { useState, useMemo } from 'react';
import {
  Activity,
  Search,
  Filter,
  Download,
  Clock,
  User,
  Eye,
  X,
  FileText,
} from 'lucide-react';
import { ActivityLog } from '../types';

interface ActivityLogViewProps {
  logs: ActivityLog[];
  onClearLogs?: () => void;
}

export default function ActivityLogView({ logs, onClearLogs }: ActivityLogViewProps) {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Tous');
  const [viewingDetail, setViewingDetail] = useState<ActivityLog | null>(null);

  // Filter logic
  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => {
        const matchesSearch =
          log.action.toLowerCase().includes(search.toLowerCase()) ||
          log.details.toLowerCase().includes(search.toLowerCase()) ||
          log.utilisateur.toLowerCase().includes(search.toLowerCase());

        const matchesRole = roleFilter === 'Tous' || log.role === roleFilter;

        return matchesSearch && matchesRole;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs, search, roleFilter]);

  // Export logs to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Date,Utilisateur,Role,Action,Details\n';

    filteredLogs.forEach((log) => {
      const row = [
        new Date(log.date).toLocaleString('fr-FR'),
        `"${log.utilisateur.replace(/"/g, '""')}"`,
        log.role,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.details.replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `journal_activite_erp_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Journal d'Activité Général
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Historique complet des actions effectuées par les collaborateurs sur l'ERP.
          </p>
        </div>

        <button
          id="btn-export-logs-csv"
          onClick={handleExportCSV}
          disabled={filteredLogs.length === 0}
          className="flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 disabled:opacity-50 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            id="logs-search-input"
            type="text"
            placeholder="Rechercher par utilisateur, action ou détails..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <Filter className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <select
            id="logs-filter-role-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full md:w-44 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-850 dark:text-zinc-250 text-xs"
          >
            <option value="Tous">Tous les rôles</option>
            <option value="Admin">Admin</option>
            <option value="RH">Ressources Humaines (RH)</option>
            <option value="Comptable">Comptable</option>
            <option value="Directeur">Directeur</option>
          </select>
        </div>
      </div>

      {/* Logs timeline layout */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="space-y-6 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-100 dark:before:bg-zinc-800">
          {filteredLogs.map((log) => (
            <div id={`log-item-${log.id}`} key={log.id} className="flex gap-4 relative">
              {/* Chronological dot indicator */}
              <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center shrink-0 z-10 text-blue-600 dark:text-blue-400">
                <Clock className="w-4 h-4" />
              </div>

              <div className="flex-1 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-zinc-900 dark:text-white flex items-center gap-1">
                      <User className="w-3.5 h-3.5 opacity-60" />
                      {log.utilisateur}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        log.role === 'Admin'
                          ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                          : log.role === 'RH'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400'
                          : log.role === 'Comptable'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}
                    >
                      {log.role}
                    </span>
                    <span className="text-zinc-400 text-[10px]">
                      • {new Date(log.date).toLocaleString('fr-FR')}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-zinc-950 dark:text-white text-xs">{log.action}</h4>
                  <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-xs">
                    {log.details}
                  </p>
                </div>

                {/* Diff Viewer Button */}
                {(log.ancienne_valeur || log.nouvelle_valeur) && (
                  <button
                    id={`btn-view-diff-${log.id}`}
                    onClick={() => setViewingDetail(log)}
                    className="inline-flex items-center gap-1.5 self-start md:self-center bg-white dark:bg-zinc-900 hover:bg-zinc-100 border border-zinc-200 dark:border-zinc-750 py-1.5 px-3 rounded-xl font-semibold text-zinc-800 dark:text-zinc-200 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Détails & Diff</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 italic">
              Aucun événement ne correspond à vos critères de recherche.
            </div>
          )}
        </div>
      </div>

      {/* Diff popup detail dialog */}
      {viewingDetail && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl relative border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-5">
              <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
                <Activity className="w-4.5 h-4.5 text-blue-600" />
                <span>Visualisation de la Modification de données</span>
              </h3>
              <button
                id="btn-close-diff-modal"
                onClick={() => setViewingDetail(null)}
                className="p-1 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <p className="font-bold">{viewingDetail.action}</p>
                <p className="text-zinc-500 dark:text-zinc-400 mt-1">{viewingDetail.details}</p>
                <p className="text-[10px] text-zinc-400 mt-2">
                  Par {viewingDetail.utilisateur} ({viewingDetail.role}) • {new Date(viewingDetail.date).toLocaleString('fr-FR')}
                </p>
              </div>

              {/* Old vs New Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {viewingDetail.ancienne_valeur && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400">Valeur Précédente</p>
                    <div className="bg-red-500/5 border border-red-500/10 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[9px] text-red-800 dark:text-red-400 leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(viewingDetail.ancienne_valeur), null, 2)}
                    </div>
                  </div>
                )}
                {viewingDetail.nouvelle_valeur && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Nouvelle Valeur</p>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[9px] text-emerald-850 dark:text-emerald-400 leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(JSON.parse(viewingDetail.nouvelle_valeur), null, 2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
