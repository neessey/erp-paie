import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Briefcase,
  TrendingUp,
  TrendingDown,
  User,
  Plus,
  Printer,
  X,
  FileText,
  Percent,
  Calculator,
  ShieldAlert,
  ClipboardList,
  ChevronRight,
  CheckCircle,
} from 'lucide-react';
import { Employee, MonthlyRecord, Role, AppSettings } from '../types';
import {
  formatCurrency,
  getMonthName,
  calculateMonthlyNet,
  getComparisonStats,
} from '../utils/calculations';

interface EmployeeDetailProps {
  employee: Employee;
  onBack: () => void;
  records: MonthlyRecord[];
  setRecords: React.Dispatch<React.SetStateAction<MonthlyRecord[]>>;
  settings: AppSettings;
  onAddLog: (action: string, details: string, prev?: string, next?: string) => void;
}

export default function EmployeeDetail({
  employee,
  onBack,
  records,
  setRecords,
  settings,
  onAddLog,
}: EmployeeDetailProps) {
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showPaySlipModal, setShowPaySlipModal] = useState<MonthlyRecord | null>(null);

  // Form state for adding new monthly record
  const [mois, setMois] = useState<number>(6); // Default June
  const [annee, setAnnee] = useState<number>(2026);
  const [salaireBase, setSalaireBase] = useState<number>(employee.salaire_base);
  const [prime, setPrime] = useState<number>(0);
  const [bonus, setBonus] = useState<number>(0);
  const [chiffreAffaires, setChiffreAffaires] = useState<number>(0);
  const [ventesCount, setVentesCount] = useState<number>(0);
  const [ventesObjectif, setVentesObjectif] = useState<number>(10);
  const [observation, setObservation] = useState('');

  const canAddRecord = true;

  // Filter records for this employee
  const employeeRecords = useMemo(() => {
    return records
      .filter((r) => r.employe_id === employee.id)
      .sort((a, b) => {
        // Sort by year desc, then month desc
        if (b.annee !== a.annee) return b.annee - a.annee;
        return b.mois - a.mois;
      });
  }, [records, employee.id]);

  // Compute month-on-month comparison for June 2026 vs May 2026
  const compStats = useMemo(() => {
    return getComparisonStats(employee.id, 6, 2026, records);
  }, [employee.id, records]);

  // Open add record modal
  const handleOpenAddRecord = () => {
    if (!canAddRecord) return;
    setMois(6);
    setAnnee(2026);
    setSalaireBase(employee.salaire_base);
    setPrime(0);
    setBonus(0);
    setChiffreAffaires(0);
    setVentesCount(0);
    setVentesObjectif(10);
    setObservation('');
    setShowAddRecordModal(true);
  };

  // Submit new monthly record
  const handleAddRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canAddRecord) return;

    // Check if record already exists for this month/year
    const exists = records.some(
      (r) => r.employe_id === employee.id && r.mois === Number(mois) && r.annee === Number(annee)
    );

    if (exists) {
      alert(`Un enregistrement existe déjà pour ${getMonthName(Number(mois))} ${annee} pour cet employé.`);
      return;
    }

    const { cotisations, impot_montant, taxes_montant, salaire_net } = calculateMonthlyNet({
      salaire_base: Number(salaireBase),
      prime: Number(prime),
      bonus: Number(bonus),
      taux_cnps: settings.taux_cnps,
      taux_impot: settings.taux_impot,
      taux_retenues: settings.taux_retenues,
      taux_assurances: settings.taux_assurances,
    });

    const newRec: MonthlyRecord = {
      id: `rec-${Date.now()}`,
      employe_id: employee.id,
      mois: Number(mois),
      annee: Number(annee),
      salaire_base: Number(salaireBase),
      prime: Number(prime),
      bonus: Number(bonus),
      chiffre_affaires: Number(chiffreAffaires),
      ventes_count: Number(ventesCount),
      ventes_objectif: Number(ventesObjectif),
      taux_tva: settings.taux_tva,
      taux_cnps: settings.taux_cnps,
      taux_impot: settings.taux_impot,
      taux_retenues: settings.taux_retenues,
      taux_assurances: settings.taux_assurances,
      cotisations,
      impot_montant,
      taxes_montant,
      salaire_net,
      observation,
    };

    setRecords((prev) => [...prev, newRec]);
    onAddLog(
      'Saisie mensuelle ajoutée',
      `Ajout de l'historique de paie de ${employee.prenom} ${employee.nom} pour ${getMonthName(Number(mois))} ${annee}. Net payé : ${formatCurrency(salaire_net, settings.devise)}`,
      undefined,
      JSON.stringify(newRec)
    );

    setShowAddRecordModal(false);
  };

  // Delete a historical record
  const handleDeleteRecord = (recId: string, month: number, year: number) => {
    if (!canAddRecord) return;
    if (window.confirm(`Voulez-vous vraiment supprimer la saisie de ${getMonthName(month)} ${year} ?`)) {
      const deleted = records.find((r) => r.id === recId);
      setRecords((prev) => prev.filter((r) => r.id !== recId));
      onAddLog(
        'Suppression saisie mensuelle',
        `Retrait de l'historique de paie de ${employee.prenom} ${employee.nom} pour ${getMonthName(month)} ${year}.`,
        JSON.stringify(deleted),
        undefined
      );
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Back button header */}
      <div className="flex items-center justify-between">
        <button
          id="btn-back-to-list"
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au répertoire</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            id="btn-add-monthly-record"
            onClick={handleOpenAddRecord}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-md shadow-blue-500/10 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Saisir Historique Mensuel</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-center md:items-start gap-6">

        <div className="flex-1 text-center md:text-left space-y-4">
          <div>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-[10px] font-mono font-bold tracking-wider text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                {employee.matricule}
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  employee.statut === 'Actif'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {employee.statut}
              </span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {employee.prenom} {employee.nom}
            </h2>
            <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center justify-center md:justify-start gap-1.5">
              <Briefcase className="w-4 h-4" />
              <span>{employee.poste} — {employee.service}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Mail className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Phone className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>{employee.telephone}</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <Calendar className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>Embauche : {new Date(employee.date_embauche).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>Né(e) le : {new Date(employee.date_naissance).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start">
              <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>Responsable : {employee.responsable || 'Aucun'}</span>
            </div>
            <div className="flex items-center gap-2 justify-center md:justify-start font-bold text-zinc-900 dark:text-white">
              <Calculator className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
              <span>Salaire Base : {formatCurrency(employee.salaire_base, settings.devise)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison & Trend Card */}
      {compStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Net Salary Progression */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Évolution du Net Payé</span>
              {compStats.netSalaryChange >= 0 ? (
                <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" /> +{compStats.netSalaryChange}%
                </span>
              ) : (
                <span className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <TrendingDown className="w-3.5 h-3.5" /> {compStats.netSalaryChange}%
                </span>
              )}
            </div>
            <p className="text-2xl font-black mt-3 text-zinc-900 dark:text-white">
              {formatCurrency(compStats.currentRecord.salaire_net, settings.devise)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              vs {formatCurrency(compStats.prevRecord ? compStats.prevRecord.salaire_net : 0, settings.devise)} le mois d'avant
            </p>
          </div>

          {/* Salaire Net Payé */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Salaire Net Actuel</span>
              <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">Période en cours</span>
            </div>
            <p className="text-2xl font-black mt-3 text-blue-600 dark:text-blue-400">
              {formatCurrency(compStats.currentRecord.salaire_net, settings.devise)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Brut global : {formatCurrency(compStats.currentRecord.salaire_base + (compStats.currentRecord.prime ?? 0) + (compStats.currentRecord.bonus ?? 0), settings.devise)}
            </p>
          </div>

          {/* Total des Charges / Retenues */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Total Retenues & Charges</span>
              <span className="text-red-500 dark:text-red-400 text-xs font-bold">
                {Math.round((( (compStats.currentRecord.cotisations ?? 0) + (compStats.currentRecord.impot_montant ?? 0) + (compStats.currentRecord.taxes_montant ?? 0) ) / (compStats.currentRecord.salaire_base + (compStats.currentRecord.prime ?? 0) + (compStats.currentRecord.bonus ?? 0))) * 100)}% du brut
              </span>
            </div>
            <p className="text-2xl font-black mt-3 text-red-600 dark:text-red-400">
              -{formatCurrency((compStats.currentRecord.cotisations ?? 0) + (compStats.currentRecord.impot_montant ?? 0) + (compStats.currentRecord.taxes_montant ?? 0), settings.devise)}
            </p>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              CNPS & Assurances : {formatCurrency(compStats.currentRecord.cotisations ?? 0, settings.devise)} | ITS : {formatCurrency(compStats.currentRecord.impot_montant ?? 0, settings.devise)}
            </p>
          </div>
        </div>
      )}

      {/* Historical Payroll / Monthly list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span>Historique des Paiements & Rémunérations</span>
          </h3>
          <span className="text-xs text-zinc-400 dark:text-zinc-500">
            {employeeRecords.length} enregistrement(s) conservé(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4">Salaire Base</th>
                <th className="py-3 px-4">Primes / Bonus</th>
                <th className="py-3 px-4">Retenues (CNPS/Impôts)</th>
                <th className="py-3 px-4">Salaire Net</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {employeeRecords.map((rec) => {
                const totalPrimes = (rec.prime ?? 0) + (rec.bonus ?? 0);
                const totalDeductions = (rec.cotisations ?? 0) + (rec.impot_montant ?? 0) + (rec.taxes_montant ?? 0);

                return (
                  <tr
                    id={`monthly-record-row-${rec.id}`}
                    key={rec.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                      {getMonthName(rec.mois)} {rec.annee}
                    </td>
                    <td className="py-3.5 px-4">{formatCurrency(rec.salaire_base, settings.devise)}</td>
                    <td className="py-3.5 px-4">
                      {totalPrimes > 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{formatCurrency(totalPrimes, settings.devise)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-red-600 dark:text-red-400">
                      -{formatCurrency(totalDeductions, settings.devise)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                      {formatCurrency(rec.salaire_net, settings.devise)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        id={`btn-payslip-${rec.id}`}
                        onClick={() => setShowPaySlipModal(rec)}
                        className="inline-flex items-center gap-1 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-750 transition-colors font-medium"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Bulletin</span>
                      </button>

                      {canAddRecord && (
                        <button
                          id={`btn-delete-record-${rec.id}`}
                          onClick={() => handleDeleteRecord(rec.id, rec.mois, rec.annee)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
                          title="Supprimer la saisie"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {employeeRecords.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-400 dark:text-zinc-500 italic">
                    Aucune saisie mensuelle enregistrée pour cet employé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Generate Pay Slip (Bulletin de paie) */}
      {showPaySlipModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between border border-zinc-200 dark:border-zinc-800">
            {/* Top Modal Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Bulletin de Paie Prêt à l'Impression</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  id="btn-print-payslip"
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-md shadow-blue-500/15"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  id="btn-close-payslip-modal"
                  onClick={() => setShowPaySlipModal(null)}
                  className="p-1.5 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-400 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Pay Slip Content Container (The printable section) */}
            <div className="bg-zinc-50 dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-150 dark:border-zinc-850 space-y-6 text-zinc-800 dark:text-zinc-200 font-sans print:bg-white print:text-black print:p-0 print:border-none">
              {/* Slip Header */}
              <div className="flex justify-between items-start pb-4 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                <div>
                  <h4 className="font-black text-sm uppercase text-blue-600 dark:text-blue-400">{settings.nom_entreprise}</h4>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-1">
                    {settings.adresse}
                  </p>
                </div>
                <div className="text-right">
                  <h5 className="font-bold text-xs uppercase tracking-wide">Bulletin de Salaire</h5>
                  <p className="text-[11px] font-bold text-zinc-900 dark:text-white mt-1">
                    Période : {getMonthName(showPaySlipModal.mois)} {showPaySlipModal.annee}
                  </p>
                </div>
              </div>

              {/* Employee and Employer detailed metadata */}
              <div className="grid grid-cols-2 gap-4 text-[11px] bg-white dark:bg-zinc-900 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <div className="space-y-1.5">
                  <p className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] font-bold tracking-wider">Employeur</p>
                  <p className="font-bold">{settings.nom_entreprise}</p>
                  <p className="text-zinc-500 dark:text-zinc-400">Régime Général</p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-zinc-400 dark:text-zinc-500 uppercase text-[9px] font-bold tracking-wider text-right">Salarié(e)</p>
                  <p className="font-bold">
                    {employee.prenom} {employee.nom}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">Matricule : {employee.matricule}</p>
                  <p className="text-zinc-500 dark:text-zinc-400">{employee.poste} ({employee.service})</p>
                  <p className="text-zinc-500 dark:text-zinc-400">Embauche : {new Date(employee.date_embauche).toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {/* Detailed Calculations Table */}
              <div className="overflow-hidden rounded-xl border border-zinc-150 dark:border-zinc-850">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3">Rubrique de paie</th>
                      <th className="py-2.5 px-3 text-right">Base</th>
                      <th className="py-2.5 px-3 text-right">Taux / Gain %</th>
                      <th className="py-2.5 px-3 text-right">Gains</th>
                      <th className="py-2.5 px-3 text-right">Retenues</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {/* Salaire de base */}
                    <tr>
                      <td className="py-2 px-3 font-semibold">Salaire de Base contractuel</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(showPaySlipModal.salaire_base, settings.devise).split(' ')[0]}</td>
                      <td className="py-2 px-3 text-right">100%</td>
                      <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                        {formatCurrency(showPaySlipModal.salaire_base, settings.devise).split(' ')[0]}
                      </td>
                      <td className="py-2 px-3 text-right">—</td>
                    </tr>

                    {/* Primes fixes */}
                    {(showPaySlipModal.prime ?? 0) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Prime de rendement / performance</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                          {formatCurrency(showPaySlipModal.prime ?? 0, settings.devise).split(' ')[0]}
                        </td>
                        <td className="py-2 px-3 text-right">—</td>
                      </tr>
                    )}

                    {/* Bonus exceptionnel */}
                    {(showPaySlipModal.bonus ?? 0) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Bonus / Gratifications exceptionnelles</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right">—</td>
                        <td className="py-2 px-3 text-right text-emerald-600 font-semibold">
                          {formatCurrency(showPaySlipModal.bonus ?? 0, settings.devise).split(' ')[0]}
                        </td>
                        <td className="py-2 px-3 text-right">—</td>
                      </tr>
                    )}

                    {/* COTISATIONS SOCIALES (CNPS) */}
                    <tr>
                      <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Cotisations Sociales (CNPS)</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(showPaySlipModal.salaire_base ?? 0, settings.devise).split(' ')[0]}</td>
                      <td className="py-2 px-3 text-right">{(showPaySlipModal.taux_cnps ?? 0)}%</td>
                      <td className="py-2 px-3 text-right">—</td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(Math.round((showPaySlipModal.salaire_base ?? 0) * ((showPaySlipModal.taux_cnps ?? 0) / 100)), settings.devise).split(' ')[0]}
                      </td>
                    </tr>

                    {/* ASSURANCES */}
                    <tr>
                      <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Assurance Santé collective</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(showPaySlipModal.salaire_base ?? 0, settings.devise).split(' ')[0]}</td>
                      <td className="py-2 px-3 text-right">{(showPaySlipModal.taux_assurances ?? 0)}%</td>
                      <td className="py-2 px-3 text-right">—</td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(Math.round((showPaySlipModal.salaire_base ?? 0) * ((showPaySlipModal.taux_assurances ?? 0) / 100)), settings.devise).split(' ')[0]}
                      </td>
                    </tr>

                    {/* IMPOT SUR REVENU */}
                    <tr>
                      <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Impôt sur le Revenu des Personnes Physiques</td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency((showPaySlipModal.salaire_base ?? 0) + (showPaySlipModal.prime ?? 0) + (showPaySlipModal.bonus ?? 0), settings.devise).split(' ')[0]}
                      </td>
                      <td className="py-2 px-3 text-right">{showPaySlipModal.taux_impot}%</td>
                      <td className="py-2 px-3 text-right">—</td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(showPaySlipModal.impot_montant ?? 0, settings.devise).split(' ')[0]}
                      </td>
                    </tr>

                    {/* AUTRES TAXES (RETENUES) */}
                    <tr>
                      <td className="py-2 px-3 text-zinc-500 dark:text-zinc-400">Autres charges & Retenues fiscales</td>
                      <td className="py-2 px-3 text-right">
                        {formatCurrency((showPaySlipModal.salaire_base ?? 0) + (showPaySlipModal.prime ?? 0) + (showPaySlipModal.bonus ?? 0), settings.devise).split(' ')[0]}
                      </td>
                      <td className="py-2 px-3 text-right">{showPaySlipModal.taux_retenues}%</td>
                      <td className="py-2 px-3 text-right">—</td>
                      <td className="py-2 px-3 text-right text-red-600">
                        {formatCurrency(showPaySlipModal.taxes_montant ?? 0, settings.devise).split(' ')[0]}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="grid grid-cols-2 gap-4 text-xs font-bold border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-4">
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-medium">Cumul des Gains</p>
                  <p className="text-sm text-emerald-600">
                    +{formatCurrency((showPaySlipModal.salaire_base ?? 0) + (showPaySlipModal.prime ?? 0) + (showPaySlipModal.bonus ?? 0), settings.devise)}
                  </p>
                </div>
                <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-xl space-y-1">
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase font-medium">Cumul des Retenues</p>
                  <p className="text-sm text-red-600">
                    -{formatCurrency((showPaySlipModal.cotisations ?? 0) + (showPaySlipModal.impot_montant ?? 0) + (showPaySlipModal.taxes_montant ?? 0), settings.devise)}
                  </p>
                </div>
              </div>

              {/* Net Pay Box */}
              <div className="bg-blue-600 text-white p-4 rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-100">Salaire Net à Payer</span>
                  <h5 className="text-xl font-black mt-0.5">{formatCurrency(showPaySlipModal.salaire_net, settings.devise)}</h5>
                </div>
                <div className="text-right text-[10px] opacity-80 leading-relaxed font-semibold">
                  <p>Payé par virement bancaire</p>
                  <p className="font-mono">{new Date().toLocaleDateString('fr-FR')}</p>
                </div>
              </div>

              {/* Footer and Signatures */}
              <div className="grid grid-cols-2 gap-4 text-[10px] text-zinc-500 dark:text-zinc-400 pt-4">
                <div>
                  <p>Pour servir et valoir ce que de droit.</p>
                  <p className="italic mt-2">La direction générale</p>
                </div>
                <div className="text-right">
                  <p>Signature de l'employé</p>
                  <div className="h-10 mt-2 border-b border-zinc-300 dark:border-zinc-700 border-dashed"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Monthly Record */}
      {showAddRecordModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-zinc-950 rounded-3xl p-6 shadow-2xl relative border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900 mb-5">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span>Saisie de Paie — {employee.prenom} {employee.nom}</span>
              </h3>
              <button
                id="btn-close-record-modal"
                onClick={() => setShowAddRecordModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form id="monthly-salary-input-form" onSubmit={handleAddRecordSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Mois
                  </label>
                  <select
                    id="record-form-mois"
                    value={mois}
                    onChange={(e) => setMois(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {getMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Année
                  </label>
                  <input
                    id="record-form-annee"
                    type="number"
                    value={annee}
                    onChange={(e) => setAnnee(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Salaire de base contractuel ({settings.devise})
                </label>
                <input
                  id="record-form-salaire-base"
                  type="number"
                  required
                  value={salaireBase}
                  onChange={(e) => setSalaireBase(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Prime de rendement ({settings.devise})
                  </label>
                  <input
                    id="record-form-prime"
                    type="number"
                    value={prime}
                    onChange={(e) => setPrime(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    Bonus Exceptionnel ({settings.devise})
                  </label>
                  <input
                    id="record-form-bonus"
                    type="number"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Observation
                </label>
                <textarea
                  id="record-form-observation"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Saisissez une observation ou justification..."
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-900 flex justify-end gap-3">
                <button
                  id="btn-cancel-record-modal"
                  type="button"
                  onClick={() => setShowAddRecordModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-record-modal"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/15"
                >
                  Calculer & Enregistrer la paie 🧾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
