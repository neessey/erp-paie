import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  ShieldAlert,
  Building,
  DollarSign,
  Percent,
  CheckCircle,
  Download,
  Upload,
  RefreshCw,
  Users,
  Briefcase,
} from 'lucide-react';
import { AppSettings, Role, Employee, MonthlyRecord } from '../types';

interface SettingsProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onImportData: (jsonData: string) => boolean;
  onExportData: () => string;
  onAddLog: (action: string, details: string, prev?: string, next?: string) => void;
  onImportLedger?: (employees: Employee[], records: MonthlyRecord[]) => void;
}

export default function Settings({
  settings,
  setSettings,
  onImportData,
  onExportData,
  onAddLog,
  onImportLedger,
}: SettingsProps) {
  const [nomEntreprise, setNomEntreprise] = useState(settings.nom_entreprise);
  const [adresse, setAdresse] = useState(settings.adresse);
  const [logo, setLogo] = useState(settings.logo);
  const [devise, setDevise] = useState(settings.devise);

  const [tauxTva, setTauxTva] = useState(settings.taux_tva);
  const [tauxCnps, setTauxCnps] = useState(settings.taux_cnps);
  const [tauxImpot, setTauxImpot] = useState(settings.taux_impot);
  const [tauxRetenues, setTauxRetenues] = useState(settings.taux_retenues);
  const [tauxAssurances, setTauxAssurances] = useState(settings.taux_assurances);

  const [importJson, setImportJson] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // States for ledger importing
  const [ledgerText, setLedgerText] = useState('');
  const [ledgerMonth, setLedgerMonth] = useState<number>(5); // May
  const [ledgerYear, setLedgerYear] = useState<number>(2026);
  const [ledgerStatus, setLedgerStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const isAdmin = true;

  // Handle Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    const oldSettings = JSON.stringify(settings);
    const updated: AppSettings = {
      nom_entreprise: nomEntreprise,
      logo,
      adresse,
      devise,
      taux_tva: Number(tauxTva),
      taux_cnps: Number(tauxCnps),
      taux_impot: Number(tauxImpot),
      taux_retenues: Number(tauxRetenues),
      taux_assurances: Number(tauxAssurances),
    };

    setSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);

    onAddLog(
      'Mise à jour des paramètres',
      `Modifications appliquées aux taxes, retenues et profils d'entreprise.`,
      oldSettings,
      JSON.stringify(updated)
    );
  };

  // Export
  const handleExportClick = () => {
    const dataStr = onExportData();
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `erp_paie_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    onAddLog('Exportation des données', 'Sauvegarde complète de la base de données exportée en fichier JSON.');
  };

  // Import
  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const success = onImportData(importJson);
      if (success) {
        setImportStatus({ type: 'success', msg: 'Données importées avec succès ! L\'ERP a été réinitialisé.' });
        setImportJson('');
        onAddLog('Importation des données', 'Restauration complète de la base de données via un fichier JSON.');
      } else {
        setImportStatus({ type: 'error', msg: 'Le format JSON est invalide pour le schéma de l\'ERP.' });
      }
    } catch (err) {
      setImportStatus({ type: 'error', msg: 'Échec de la lecture du fichier JSON. Vérifiez sa syntaxe.' });
    }
  };

  // Submit and Parse ledger
  const handleLedgerImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onImportLedger) return;

    try {
      const lines = ledgerText.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) {
        setLedgerStatus({ type: 'error', msg: 'Veuillez saisir ou coller le livre de paie.' });
        return;
      }

      const importedEmployees: Employee[] = [];
      const importedRecords: MonthlyRecord[] = [];

      lines.forEach((line) => {
        // Skip header lines
        if (
          line.includes('Matricule') ||
          line.includes('NOM ET PRENOMS') ||
          line.includes('TOTAL') ||
          line.includes('LIVRE DE PAIE')
        ) {
          return;
        }

        // Split by tabs, semicolons, or 2+ spaces
        let cols = line.split('\t');
        if (cols.length < 5) {
          cols = line.split(/ {2,}|;/);
        }

        if (cols.length < 10) return;

        const matricule = cols[0]?.trim();
        const nomComplet = cols[1]?.trim();
        if (!matricule || !nomComplet || nomComplet === '0') return;

        const parseVal = (str: string) => {
          if (!str) return 0;
          const clean = str.replace(/\s/g, '').replace(/,/g, '.');
          const num = parseFloat(clean);
          return isNaN(num) ? 0 : num;
        };

        const jours_travailles = parseVal(cols[2]);
        const salaire_base = parseVal(cols[3]);
        const sursalaire = parseVal(cols[4]);
        const prime_anciennete = parseVal(cols[5]);
        const prime_responsabilite = parseVal(cols[12]) || parseVal(cols[11]);
        const indemnite_logement = parseVal(cols[14]) || parseVal(cols[13]);
        const commission = parseVal(cols[16]);
        const transport_imposable = parseVal(cols[24]);
        const transport_non_imposable = parseVal(cols[51]) || parseVal(cols[50]);
        const cnps_salarie = parseVal(cols[30]);
        const its_salarie = parseVal(cols[29]);
        const salaire_net = parseVal(cols[60]) || parseVal(cols[cols.length - 3]) || parseVal(cols[59]);

        const nameParts = nomComplet.split(/\s+/);
        const nom = nameParts[0] || 'Nom';
        const prenom = nameParts.slice(1).join(' ') || 'Prénom';

        const empId = `emp-${matricule.toLowerCase()}`;
        const employee: Employee = {
          id: empId,
          matricule,
          nom,
          prenom,
          sexe: 'M',
          date_naissance: '1990-01-01',
          telephone: '+225 00 00 00 00',
          email: `${nom.toLowerCase()}@leandistribution.ci`,
          service: 'Lean Distribution',
          poste: 'Collaborateur',
          responsable: 'Direction',
          date_embauche: '2025-01-01',
          salaire_base,
          statut: 'Actif',
        };

        const record: MonthlyRecord = {
          id: `rec-lean-${matricule.toLowerCase()}-${ledgerMonth}-${ledgerYear}`,
          employe_id: empId,
          mois: ledgerMonth,
          annee: ledgerYear,
          salaire_base,
          prime: prime_anciennete + prime_responsabilite + commission,
          bonus: sursalaire,
          chiffre_affaires: 0,
          ventes_count: 0,
          ventes_objectif: 0,
          taux_tva: 18,
          taux_cnps: 5.5,
          taux_impot: 10,
          taux_retenues: 4,
          taux_assurances: 0,
          cotisations: cnps_salarie,
          impot_montant: its_salarie,
          taxes_montant: 0,
          salaire_net,
          observation: 'Importé via le livre de paie',
          jours_travailles,
          sursalaire,
          prime_anciennete,
          prime_responsabilite,
          indemnite_logement,
          commission,
          transport_imposable,
          transport_non_imposable,
        };

        importedEmployees.push(employee);
        importedRecords.push(record);
      });

      if (importedEmployees.length === 0) {
        setLedgerStatus({ type: 'error', msg: 'Aucun employé valide n\'a été trouvé dans le livre de paie.' });
        return;
      }

      onImportLedger(importedEmployees, importedRecords);
      setLedgerStatus({
        type: 'success',
        msg: `${importedEmployees.length} employés et fiches de paie pour ${ledgerMonth}/${ledgerYear} ont été importés avec succès !`,
      });
      setLedgerText('');
      onAddLog(
        'Importation de Livre de Paie',
        `Importation de ${importedEmployees.length} lignes de salaire depuis le format textuel pour le mois ${ledgerMonth}/${ledgerYear}.`
      );
    } catch (err) {
      setLedgerStatus({ type: 'error', msg: 'Une erreur s\'est produite lors de la lecture du livre de paie. Vérifiez la structure.' });
    }
  };

  const handleLoadSampleLedger = () => {
    setLedgerText(`LD2010\tKOFFI  Kouadio Arnaud\t30\t164 938\t271 083\t9 896\t0\t0\t0\t0\t0\t0\t30 000\t0\t50 000\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t525 917\t0\t495 917\t16 500\t63 643\t33 133\t1 500\t2 250\t4 313\t1 984\t2 976\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t6 000\t0\t0\t5 951\t20 000\t0\t30 000\t0\t0\t0\t0\t0\t0\t441 641\t1 500\t40 496
LD20104\tBEUGRE  Dago Antonin\t30\t83 344\t53 000\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t72 460\t0\t0\t0\t0\t0\t0\t0\t0\t208 804\t0\t188 804\t0\t11 025\t12 554\t1 500\t850\t1 631\t750\t1 125\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t1 500\t0\t0\t2 250\t20 000\t0\t0\t0\t0\t0\t0\t0\t0\t170 479\t1 500\t15 329
LD20110\tBAILLY  Tiéko Félicité\t30\t81 407\t63 593\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t145 000\t0\t125 000\t0\t4 466\t9 788\t1 500\t653\t1 253\t576\t864\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t1 500\t0\t0\t1 488\t20 000\t0\t0\t0\t0\t0\t0\t0\t0\t127 746\t1 500\t11 773
LD20114\tIRIE  Lou Djenan Suzanne\t30\t81 407\t153 593\t4 884\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t239 884\t0\t219 884\t0\t15 158\t15 035\t1 500\t1 019\t1 955\t878\t1 317\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t3 000\t0\t0\t2 621\t20 000\t0\t0\t0\t0\t0\t0\t0\t0\t199 191\t1 500\t18 411`);
    setLedgerMonth(5);
    setLedgerYear(2026);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Paramètres du Système
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Configurez les charges patronales, la devise locale et gérez l'archivage de vos données.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core settings form */}
        <div className="lg:col-span-2 space-y-6">
          <form id="erp-settings-config-form" onSubmit={handleSave} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6 text-xs">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Building className="w-5 h-5 text-blue-600" />
              <span>Profil d'Entreprise & Rémunération</span>
            </h3>

            {/* Corporate identity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Raison Sociale / Nom <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-form-company-name"
                  type="text"
                  required
                  disabled={!isAdmin}
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Devise Monétaire Actuelle <span className="text-red-500">*</span>
                </label>
                <select
                  id="settings-form-currency"
                  disabled={!isAdmin}
                  value={devise}
                  onChange={(e) => setDevise(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="FCFA">Franc CFA (FCFA)</option>
                  <option value="€">Euro (€)</option>
                  <option value="$">US Dollar ($)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                Adresse du siège social <span className="text-red-500">*</span>
              </label>
              <input
                id="settings-form-company-address"
                type="text"
                required
                disabled={!isAdmin}
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Configurable Rates / Taxes */}
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 pt-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <Percent className="w-5 h-5 text-blue-600" />
              <span>Cotisations Sociales & Prélèvements de Paie</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Taux CNPS (%) <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-form-cnps"
                  type="number"
                  step="0.1"
                  required
                  disabled={!isAdmin}
                  value={tauxCnps}
                  onChange={(e) => setTauxCnps(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Taux Impôt s/ Revenu (%) <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-form-impot"
                  type="number"
                  step="0.1"
                  required
                  disabled={!isAdmin}
                  value={tauxImpot}
                  onChange={(e) => setTauxImpot(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Assurances / Mutuelle (%) <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-form-insurance"
                  type="number"
                  step="0.1"
                  required
                  disabled={!isAdmin}
                  value={tauxAssurances}
                  onChange={(e) => setTauxAssurances(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Autres Retenues / Taxes (%) <span className="text-red-500">*</span>
                </label>
                <input
                  id="settings-form-retenues"
                  type="number"
                  step="0.1"
                  required
                  disabled={!isAdmin}
                  value={tauxRetenues}
                  onChange={(e) => setTauxRetenues(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                  Taux TVA indicatif (%)
                </label>
                <input
                  id="settings-form-tva"
                  type="number"
                  step="0.1"
                  disabled={!isAdmin}
                  value={tauxTva}
                  onChange={(e) => setTauxTva(Number(e.target.value))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 disabled:opacity-60 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end items-center gap-3">
                {saveSuccess && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Paramètres sauvegardés avec succès !
                  </span>
                )}
                <button
                  id="btn-submit-company-settings"
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-blue-500/10 transition-colors"
                >
                  Appliquer les modifications
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Backups / import export card */}
        <div className="space-y-6">
          {/* Backups Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-6 text-xs">
            <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              <span>Sauvegardes & Imports</span>
            </h3>

            <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Conservez une copie locale de l'ensemble de votre base de données (employés, historique des saisies de paie, etc.) au format JSON.
            </p>

            <button
              id="btn-export-settings-data"
              onClick={handleExportClick}
              className="w-full flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-750 py-3 rounded-xl font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Télécharger la sauvegarde (.json)</span>
            </button>

            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 pt-5 space-y-4">
              <h4 className="font-bold text-zinc-950 dark:text-white">Restaurer / Importer une sauvegarde</h4>

              <form id="import-json-data-form" onSubmit={handleImportSubmit} className="space-y-3">
                <textarea
                  id="import-data-json-textarea"
                  value={importJson}
                  onChange={(e) => setImportJson(e.target.value)}
                  placeholder='Collez le contenu JSON de votre fichier de sauvegarde ici...'
                  rows={4}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[10px]"
                ></textarea>

                {importStatus && (
                  <p
                    className={`p-2.5 rounded-lg font-medium text-[11px] ${
                      importStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                    }`}
                  >
                    {importStatus.msg}
                  </p>
                )}

                <button
                  id="btn-import-settings-data"
                  type="submit"
                  disabled={!importJson.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/10 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restaurer maintenant</span>
                </button>
              </form>
            </div>
          </div>

          {/* Importateur de Livre de Paie (Lean Distribution) */}
          {onImportLedger && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>Importation de Livre de Paie</span>
              </h3>

              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Collez ou importez un livre de paie au format textuel (colonnes séparées par des tabulations ou des points-virgules) pour enregistrer automatiquement tous les employés et leurs fiches de paie.
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  id="btn-load-sample-ledger"
                  onClick={handleLoadSampleLedger}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-750 py-2.5 rounded-xl transition-colors font-medium"
                >
                  Charger les données de Lean Distribution (Mai 2026)
                </button>
              </div>

              <form onSubmit={handleLedgerImportSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Mois de Paie (1-12)</label>
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={ledgerMonth}
                      onChange={(e) => setLedgerMonth(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Année</label>
                    <input
                      type="number"
                      value={ledgerYear}
                      onChange={(e) => setLedgerYear(Number(e.target.value))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <textarea
                  value={ledgerText}
                  onChange={(e) => setLedgerText(e.target.value)}
                  placeholder="Collez ici les lignes du livre de paie (ex: LD2010...)"
                  rows={5}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono text-[10px] text-zinc-800 dark:text-zinc-200"
                />

                {ledgerStatus && (
                  <p
                    className={`p-2.5 rounded-lg font-medium text-[11px] ${
                      ledgerStatus.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                    }`}
                  >
                    {ledgerStatus.msg}
                  </p>
                )}

                <button
                  type="submit"
                  id="btn-submit-ledger-import"
                  disabled={!ledgerText.trim()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold shadow-md shadow-blue-500/10 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Lancer l'importation de paie</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
