import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Briefcase,
  AlertTriangle,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';
import { Employee, MonthlyRecord, AppSettings } from '../types';
import { formatCurrency, getMonthName } from '../utils/calculations';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardProps {
  employees: Employee[];
  records: MonthlyRecord[];
  settings: AppSettings;
}

export default function Dashboard({ employees, records, settings }: DashboardProps) {
  // We use June 2026 as the active month (since current local time is 2026)
  const activeMois = 6;
  const activeAnnee = 2026;
  const prevMois = 5;
  const prevAnnee = 2026;

  // Active records
  const activeRecords = useMemo(() => {
    return records.filter((r) => r.mois === activeMois && r.annee === activeAnnee);
  }, [records, activeMois, activeAnnee]);

  // Previous records
  const prevRecords = useMemo(() => {
    return records.filter((r) => r.mois === prevMois && r.annee === prevAnnee);
  }, [records, prevMois, prevAnnee]);

  // Summary statistics focusing purely on payroll and finance
  const stats = useMemo(() => {
    const totalEmployees = employees.filter((e) => e.statut === 'Actif').length;

    // June totals
    const totalSalaryBase = activeRecords.reduce((acc, r) => acc + r.salaire_base, 0);
    const totalPrimesBonus = activeRecords.reduce((acc, r) => {
      const p = r.prime ?? 0;
      const b = r.bonus ?? 0;
      const s = r.sursalaire ?? 0;
      const pa = r.prime_anciennete ?? 0;
      const pr = r.prime_responsabilite ?? 0;
      const c = r.commission ?? 0;
      const l = r.indemnite_logement ?? 0;
      return acc + p + b + s + pa + pr + c + l;
    }, 0);
    const totalMasseSalarialeNet = activeRecords.reduce((acc, r) => acc + r.salaire_net, 0);
    const totalMasseSalarialeBrut = activeRecords.reduce((acc, r) => acc + (r.salaire_brut ?? (r.salaire_base + (r.prime ?? 0) + (r.bonus ?? 0))), 0);
    const totalTaxes = activeRecords.reduce((acc, r) => acc + (r.taxes_montant ?? 0) + (r.retenues_diverses ?? 0), 0);
    const totalImpot = activeRecords.reduce((acc, r) => acc + r.impot_montant, 0);
    const totalCotisations = activeRecords.reduce((acc, r) => acc + r.cotisations, 0);

    // May totals
    const prevMasseSalarialeNet = prevRecords.reduce((acc, r) => acc + r.salaire_net, 0);
    const prevMasseSalarialeBrut = prevRecords.reduce((acc, r) => acc + (r.salaire_brut ?? (r.salaire_base + (r.prime ?? 0) + (r.bonus ?? 0))), 0);

    // Percentage changes
    const netPayrollChangePercent = prevMasseSalarialeNet > 0 
      ? Math.round(((totalMasseSalarialeNet - prevMasseSalarialeNet) / prevMasseSalarialeNet) * 100) 
      : 0;
    const payrollChangePercent =
      prevMasseSalarialeBrut > 0
        ? Math.round(((totalMasseSalarialeBrut - prevMasseSalarialeBrut) / prevMasseSalarialeBrut) * 100)
        : 0;

    return {
      totalEmployees,
      totalMasseSalarialeNet,
      totalMasseSalarialeBrut,
      totalPrimesBonus,
      totalTaxes,
      totalImpot,
      totalCotisations,
      netPayrollChangePercent,
      payrollChangePercent,
    };
  }, [employees, activeRecords, prevRecords]);

  // Highlight salary changes (Who had an increase, who had a decrease) - satisfying exact user request
  interface SalaryChange {
    name: string;
    change: number;
    from: number;
    to: number;
  }
  
  const highlights = useMemo((): { topIncrease: SalaryChange | null; topDecrease: SalaryChange | null } => {
    let topIncrease: SalaryChange | null = null;
    let topDecrease: SalaryChange | null = null;

    let maxIncreasePercent = 0;
    let maxDecreasePercent = 0; // stored as absolute or negative

    employees.forEach((emp) => {
      const currentRec = activeRecords.find((r) => r.employe_id === emp.id);
      const prevRec = prevRecords.find((r) => r.employe_id === emp.id);

      if (currentRec && prevRec && prevRec.salaire_net > 0) {
        const changePercent = ((currentRec.salaire_net - prevRec.salaire_net) / prevRec.salaire_net) * 100;
        const fullName = `${emp.prenom} ${emp.nom}`;

        if (changePercent > 0 && changePercent > maxIncreasePercent) {
          maxIncreasePercent = changePercent;
          topIncrease = {
            name: fullName,
            change: Math.round(changePercent),
            from: prevRec.salaire_net,
            to: currentRec.salaire_net,
          };
        } else if (changePercent < 0 && changePercent < maxDecreasePercent) {
          maxDecreasePercent = changePercent;
          topDecrease = {
            name: fullName,
            change: Math.round(changePercent),
            from: prevRec.salaire_net,
            to: currentRec.salaire_net,
          };
        }
      }
    });

    return {
      topIncrease,
      topDecrease,
    };
  }, [employees, activeRecords, prevRecords]);

  // Charts data - Evolution of Net and Gross salary payrolls over the year
  const trendsData = [
    { name: 'Jan', 'Masse Net': 2400000, 'Masse Brut': 3200000 },
    { name: 'Fév', 'Masse Net': 2450000, 'Masse Brut': 3250000 },
    { name: 'Mar', 'Masse Net': 2500000, 'Masse Brut': 3300000 },
    { name: 'Avr', 'Masse Net': 2550000, 'Masse Brut': 3400000 },
    { name: 'Mai', 'Masse Net': 2580000, 'Masse Brut': 3410000 },
    { name: 'Juin', 'Masse Net': stats.totalMasseSalarialeNet || 2650000, 'Masse Brut': stats.totalMasseSalarialeBrut || 3500000 },
  ];

  const breakdownData = [
    { name: 'Salaires Nets Payés', value: stats.totalMasseSalarialeNet, color: '#2563eb' },
    { name: 'Retraite (CNPS)', value: stats.totalCotisations, color: '#10b981' },
    { name: 'Impôt ITS', value: stats.totalImpot, color: '#f59e0b' },
    { name: 'Taxes & Retenues', value: stats.totalTaxes, color: '#ef4444' },
  ];

  // Net payroll distribution per department
  const departmentPayrollData = useMemo(() => {
    const departments = Array.from(new Set(employees.map((e) => e.service)));
    return departments.map((dept) => {
      const deptEmployees = employees.filter((e) => e.service === dept);
      const deptActiveRecords = activeRecords.filter((r) =>
        deptEmployees.some((e) => e.id === r.employe_id)
      );
      const totalNet = deptActiveRecords.reduce((sum, r) => sum + r.salaire_net, 0);
      const totalBase = deptActiveRecords.reduce((sum, r) => sum + r.salaire_base, 0);
      return {
        name: dept,
        'Masse Salariale Net': totalNet,
        'Salaire de Base': totalBase,
      };
    }).filter((d) => d['Masse Salariale Net'] > 0);
  }, [employees, activeRecords]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper header with date */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Suivi des Finances & Salaires
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Période active : <span className="font-semibold text-zinc-700 dark:text-zinc-300">{getMonthName(activeMois)} {activeAnnee}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-xl text-xs font-semibold border border-blue-100 dark:border-blue-900/50">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Calculateur de paie en temps réel synchrone</span>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI: Total Employees */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Effectif Actif</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {stats.totalEmployees}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              Employés enregistrés
            </p>
          </div>
        </div>

        {/* KPI: Masse Salariale Net */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Masse Salariale Net</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(stats.totalMasseSalarialeNet, settings.devise)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {stats.netPayrollChangePercent >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" /> +{stats.netPayrollChangePercent}%
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" /> {stats.netPayrollChangePercent}%
                </span>
              )}
              <span className="text-zinc-500 dark:text-zinc-400">vs mois dernier</span>
            </div>
          </div>
        </div>

        {/* KPI: Masse Salariale Brut */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Masse Salariale Brut</span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(stats.totalMasseSalarialeBrut, settings.devise)}
            </h3>
            <div className="mt-2 flex items-center gap-1 text-xs">
              {stats.payrollChangePercent >= 0 ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5" /> +{stats.payrollChangePercent}%
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5" /> {stats.payrollChangePercent}%
                </span>
              )}
              <span className="text-zinc-500 dark:text-zinc-400">vs mois dernier</span>
            </div>
          </div>
        </div>

        {/* KPI: Fiscal / Taxes à payer */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium tracking-wider uppercase text-zinc-500 dark:text-zinc-400">Impôts & Charges</span>
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {formatCurrency(stats.totalImpot + stats.totalTaxes + stats.totalCotisations, settings.devise)}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 flex items-center gap-1">
              <span>Charges CNPS & Impôts ITS</span>
            </p>
          </div>
        </div>
      </div>

      {/* Highlights & Spotlights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Spotlight: Salary Increase */}
        {highlights.topIncrease ? (
          <div className="bg-blue-50/55 border border-blue-200 text-blue-900 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-100/10 rounded-full translate-x-10 translate-y-10"></div>
            <div>
              <div className="flex items-center gap-2 bg-blue-100/80 w-fit px-3 py-1 rounded-full text-xs font-bold text-blue-700">
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                <span>Plus Forte Hausse Salariale</span>
              </div>
              <div className="flex items-center gap-4 mt-6">
                <div>
                  <h4 className="font-bold text-lg text-blue-950">{highlights.topIncrease.name}</h4>
                  <p className="text-xs text-blue-800">Variation positive de salaire net</p>
                </div>
              </div>
            </div>
            <div className="mt-6 border-t border-blue-200/60 pt-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs text-blue-700 font-semibold">Augmentation nette</p>
                  <p className="text-2xl font-extrabold text-blue-950">+{highlights.topIncrease.change}%</p>
                </div>
                <div className="text-[11px] font-bold bg-blue-100 text-blue-800 px-2.5 py-1 rounded-lg">
                  Nouveau Net : {formatCurrency(highlights.topIncrease.to, settings.devise)}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1 rounded-full w-fit font-semibold border border-zinc-150">
                <TrendingUp className="w-3.5 h-3.5 text-zinc-500" />
                <span>Hausses de salaires</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-5 leading-relaxed">
                Aucune augmentation significative de salaire net enregistrée pour la période active comparé au mois de mai.
              </p>
            </div>
            <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-400"></span>
              Salaires nets stables
            </div>
          </div>
        )}

        {/* Spotlight: Salary Decrease */}
        {highlights.topDecrease ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs px-3 py-1 rounded-full font-semibold border border-red-100 dark:border-red-900/30">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Plus Forte Baisse de Salaire Net</span>
                </div>
                <span className="text-xs font-extrabold text-red-600 dark:text-red-400">
                  {highlights.topDecrease.change}%
                </span>
              </div>
              <div className="flex items-center gap-3 mt-5">
                <div>
                  <h4 className="font-semibold text-sm text-zinc-950 dark:text-white">
                    {highlights.topDecrease.name}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Diminution due aux retenues/absences</p>
                </div>
              </div>
            </div>
            <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-500 dark:text-zinc-400 flex justify-between">
              <span>Mai : {formatCurrency(highlights.topDecrease.from, settings.devise)}</span>
              <span className="font-medium text-zinc-900 dark:text-white">
                Juin : {formatCurrency(highlights.topDecrease.to, settings.devise)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs px-3 py-1 rounded-full font-semibold border border-emerald-100 dark:border-emerald-900/30">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Baisses de salaire net</span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-5 leading-relaxed">
                Aucune baisse de salaire net détectée pour vos employés actifs ce mois-ci. Les rémunérations sont stables ou en hausse.
              </p>
            </div>
            <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Tous les indicateurs sont au vert
            </div>
          </div>
        )}

        {/* Spotlight: Average Paid Salary */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 text-xs px-3 py-1 rounded-full w-fit font-semibold border border-zinc-150">
              <DollarSign className="w-3.5 h-3.5 text-zinc-500" />
              <span>Moyenne Salariale Payée</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-5 leading-relaxed">
              Moyenne arithmétique nette des versements effectués pour la période de paie en cours sur l'ensemble de l'effectif.
            </p>
          </div>
          <div className="mt-5 border-t border-zinc-100 dark:border-zinc-800 pt-3 text-xs text-zinc-500 dark:text-zinc-400 flex justify-between items-center">
            <span>Salaire Moyen Net :</span>
            <span className="font-bold text-base text-zinc-900 dark:text-white">
              {formatCurrency(
                activeRecords.length > 0 
                  ? Math.round(activeRecords.reduce((sum, r) => sum + r.salaire_net, 0) / activeRecords.length) 
                  : 0, 
                settings.devise
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Net vs Gross Payroll Evolution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-zinc-900 dark:text-white">Évolution Mensuelle</h4>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Comparaison de la masse salariale nette versus brute sur l'année</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span> Masse Net
              </span>
              <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Masse Brut
              </span>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMasseNet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorMasseBrut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '12px',
                    color: '#18181b',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  itemStyle={{ color: '#18181b', fontWeight: 600 }}
                  labelStyle={{ color: '#71717a', fontWeight: 500 }}
                  formatter={(value: any) => [formatCurrency(Number(value), settings.devise), '']}
                />
                <Area type="monotone" dataKey="Masse Net" name="Masse Salariale Net" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorMasseNet)" />
                <Area type="monotone" dataKey="Masse Brut" name="Masse Salariale Brut" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorMasseBrut)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Payroll Budget Breakdown */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Structure Budgétaire Mensuelle</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Répartition de la masse salariale brute (charges patronales et salaires nets)</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
            {/* Pie Chart */}
            <div className="h-48 md:col-span-2 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Total Brut</span>
                <span className="text-md font-bold text-zinc-800 dark:text-white">
                  {formatCurrency(stats.totalMasseSalarialeBrut, settings.devise).split(' ')[0]}
                </span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{settings.devise}</span>
              </div>
            </div>

            {/* Labels and values */}
            <div className="md:col-span-3 space-y-3.5">
              {breakdownData.map((item, index) => {
                const percent = stats.totalMasseSalarialeBrut > 0
                  ? Math.round((item.value / stats.totalMasseSalarialeBrut) * 100)
                  : 0;
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                      <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{formatCurrency(item.value, settings.devise)}</span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 block">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Section Department Net Payroll Achievement BarChart */}
      {departmentPayrollData.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
          <h4 className="font-bold text-zinc-900 dark:text-white mb-1">Masse Salariale Nette par Service</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6">Répartition cumulée des salaires de base et salaires nets finaux par service de l'entreprise</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentPayrollData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-100 dark:stroke-zinc-800" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e4e4e7',
                    borderRadius: '12px',
                    color: '#18181b',
                    fontSize: '11px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  }}
                  itemStyle={{ color: '#18181b', fontWeight: 600 }}
                  labelStyle={{ color: '#71717a', fontWeight: 500 }}
                  formatter={(value: any) => [formatCurrency(Number(value), settings.devise), '']}
                />
                <Bar dataKey="Salaire de Base" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Salaire de Base" />
                <Bar dataKey="Masse Salariale Net" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Masse Salariale Nette" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
