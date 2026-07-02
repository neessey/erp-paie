import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Trash,
  Search,
  Calculator,
  ShieldAlert,
  Download,
  Calendar,
  Scale,
  ArrowLeftRight,
  Sparkles,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Employee, MonthlyRecord, Role, AppSettings } from '../types';
import { formatCurrency, getMonthName, calculateMonthlyNet } from '../utils/calculations';

interface PayrollManagerProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  records: MonthlyRecord[];
  setRecords: React.Dispatch<React.SetStateAction<MonthlyRecord[]>>;
  settings: AppSettings;
  onAddLog: (action: string, details: string, prev?: string, next?: string) => void;
}

export default function PayrollManager({
  employees,
  setEmployees,
  records,
  setRecords,
  settings,
  onAddLog,
}: PayrollManagerProps) {
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // June
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Excel Import States
  const [showImportModal, setShowImportModal] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importMonth, setImportMonth] = useState<number>(6);
  const [importYear, setImportYear] = useState<number>(2026);
  const [matchedData, setMatchedData] = useState<any[]>([]);
  const [columnsMapped, setColumnsMapped] = useState<{ header: string; fieldKey: string; matchedLabel: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Sync import period when main selected period changes
  useEffect(() => {
    setImportMonth(selectedMonth);
    setImportYear(selectedYear);
  }, [selectedMonth, selectedYear]);

  // View tabs
  const [activeTab, setActiveTab] = useState<'saisie' | 'compare'>('saisie');

  // Comparator states
  const [compEmpId, setCompEmpId] = useState<string>('all');
  const [globalCompareTab, setGlobalCompareTab] = useState<'employees' | 'rubrics'>('employees');
  const [compMonthA, setCompMonthA] = useState<number>(5); // May
  const [compYearA, setCompYearA] = useState<number>(2026);
  const [compMonthB, setCompMonthB] = useState<number>(6); // June
  const [compYearB, setCompYearB] = useState<number>(2026);

  // Form Modal States
  const [showModal, setShowModal] = useState(false);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);
  const [activeRecord, setActiveRecord] = useState<MonthlyRecord | null>(null);

  // West African / Ivorian Payroll Form Fields
  const [joursTravailles, setJoursTravailles] = useState(30);
  const [salaireBase, setSalaireBase] = useState(400000);
  const [sursalaire, setSursalaire] = useState(0);
  const [primeAnciennete, setPrimeAnciennete] = useState(0);
  const [primeResponsabilite, setPrimeResponsabilite] = useState(0);
  const [indemniteLogement, setIndemniteLogement] = useState(0);
  const [commission, setCommission] = useState(0);
  const [transportImposable, setTransportImposable] = useState(0);
  const [transportNonImposable, setTransportNonImposable] = useState(0);
  const [cotisations, setCotisations] = useState(0); // CNPS
  const [impotMontant, setImpotMontant] = useState(0); // ITS
  const [retenuesDiverses, setRetenuesDiverses] = useState(0);
  const [salaireNet, setSalaireNet] = useState(0);
  const [observation, setObservation] = useState('');

  const canEdit = true;

  // Recalculate Net in real time based on user typing
  useEffect(() => {
    const brutImposable = 
      Number(salaireBase) + 
      Number(sursalaire) + 
      Number(primeAnciennete) + 
      Number(primeResponsabilite) + 
      Number(indemniteLogement) + 
      Number(commission) + 
      Number(transportImposable);
    
    const deductions = Number(cotisations) + Number(impotMontant) + Number(retenuesDiverses);
    const net = brutImposable + Number(transportNonImposable) - deductions;
    setSalaireNet(Math.round(Math.max(0, net)));
  }, [
    salaireBase,
    sursalaire,
    primeAnciennete,
    primeResponsabilite,
    indemniteLogement,
    commission,
    transportImposable,
    transportNonImposable,
    cotisations,
    impotMontant,
    retenuesDiverses,
  ]);

  // Build grid data for the selected month/year
  const gridData = useMemo(() => {
    return employees
      .filter((emp) => {
        const fullName = `${emp.prenom} ${emp.nom}`.toLowerCase();
        return (
          fullName.includes(search.toLowerCase()) ||
          emp.matricule.toLowerCase().includes(search.toLowerCase()) ||
          emp.service.toLowerCase().includes(search.toLowerCase())
        );
      })
      .map((emp) => {
        const record = records.find(
          (r) => r.employe_id === emp.id && r.mois === selectedMonth && r.annee === selectedYear
        );

        return {
          employee: emp,
          record,
        };
      });
  }, [employees, records, selectedMonth, selectedYear, search]);

  // Open Edit / Create form
  const handleOpenForm = (emp: Employee, record: MonthlyRecord | undefined) => {
    if (!canEdit) return;
    setActiveEmployee(emp);
    if (record) {
      setActiveRecord(record);
      setJoursTravailles(record.jours_travailles ?? 30);
      setSalaireBase(record.salaire_base);
      setSursalaire(record.sursalaire ?? 0);
      setPrimeAnciennete(record.prime_anciennete ?? 0);
      setPrimeResponsabilite(record.prime_responsabilite ?? 0);
      setIndemniteLogement(record.indemnite_logement ?? 0);
      setCommission(record.commission ?? 0);
      setTransportImposable(record.transport_imposable ?? 0);
      setTransportNonImposable(record.transport_non_imposable ?? 0);
      setCotisations(record.cotisations ?? 0);
      setImpotMontant(record.impot_montant ?? 0);
      setRetenuesDiverses(record.retenues_diverses ?? 0);
      setObservation(record.observation);
    } else {
      setActiveRecord(null);
      setJoursTravailles(30);
      setSalaireBase(emp.salaire_base);
      setSursalaire(0);
      setPrimeAnciennete(0);
      setPrimeResponsabilite(0);
      setIndemniteLogement(0);
      setCommission(0);
      setTransportImposable(0);
      setTransportNonImposable(0);
      
      // Auto-compute draft social deductions for standard West African bareme reference
      const cnps = Math.round(emp.salaire_base * (settings.taux_cnps / 100));
      const its = Math.round(emp.salaire_base * (settings.taux_impot / 100));
      setCotisations(cnps);
      setImpotMontant(its);
      setRetenuesDiverses(0);
      setObservation('');
    }
    setShowModal(true);
  };

  // Submit Payroll
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !activeEmployee) return;

    const payload: Partial<MonthlyRecord> = {
      jours_travailles: Number(joursTravailles),
      salaire_base: Number(salaireBase),
      sursalaire: Number(sursalaire),
      prime_anciennete: Number(primeAnciennete),
      prime_responsabilite: Number(primeResponsabilite),
      indemnite_logement: Number(indemniteLogement),
      commission: Number(commission),
      transport_imposable: Number(transportImposable),
      transport_non_imposable: Number(transportNonImposable),
      cotisations: Number(cotisations),
      impot_montant: Number(impotMontant),
      retenues_diverses: Number(retenuesDiverses),
      salaire_net: Number(salaireNet),
      prime: Number(primeAnciennete) + Number(primeResponsabilite) + Number(commission),
      bonus: Number(sursalaire),
      observation,
    };

    if (activeRecord) {
      // Edit existing record
      const oldVal = JSON.stringify(activeRecord);
      const updated: MonthlyRecord = {
        ...activeRecord,
        ...payload,
      };

      setRecords((prev) => prev.map((item) => (item.id === activeRecord.id ? updated : item)));
      onAddLog(
        'Saisie mensuelle modifiée',
        `Correction apportée à la paie de ${activeEmployee.prenom} ${activeEmployee.nom} pour ${getMonthName(selectedMonth)} ${selectedYear}.`,
        oldVal,
        JSON.stringify(updated)
      );
    } else {
      // Create new record
      const newRec: MonthlyRecord = {
        id: `rec-${Date.now()}`,
        employe_id: activeEmployee.id,
        mois: selectedMonth,
        annee: selectedYear,
        chiffre_affaires: 0,
        ventes_count: 0,
        ventes_objectif: 0,
        taux_tva: settings.taux_tva,
        taux_cnps: settings.taux_cnps,
        taux_impot: settings.taux_impot,
        taux_retenues: settings.taux_retenues,
        taux_assurances: settings.taux_assurances,
        taxes_montant: 0,
        ...payload,
      } as MonthlyRecord;

      setRecords((prev) => [...prev, newRec]);
      onAddLog(
        'Saisie mensuelle ajoutée',
        `Saisie de paie enregistrée pour ${activeEmployee.prenom} ${activeEmployee.nom} (${getMonthName(selectedMonth)} ${selectedYear}). Net : ${formatCurrency(salaireNet, settings.devise)}`,
        undefined,
        JSON.stringify(newRec)
      );
    }

    setShowModal(false);
  };

  // Export payroll summary of the month
  const handleExportMonthSummary = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Matricule,Employe,Service,Poste,Salaire Base,Primes/Bonus,Taxes,Retenues CNPS,Net Paye\n';

    gridData.forEach(({ employee, record }) => {
      const row = [
        employee.matricule,
        `"${employee.prenom} ${employee.nom}"`,
        employee.service,
        employee.poste,
        employee.salaire_base,
        record ? (record.prime ?? 0) + (record.bonus ?? 0) : 0,
        record ? (record.taxes_montant ?? 0) + (record.impot_montant ?? 0) : 0,
        record ? record.cotisations ?? 0 : 0,
        record ? record.salaire_net ?? 0 : 0,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `recapitulatif_paie_${getMonthName(selectedMonth)}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Build comparison list
  const compareData = useMemo(() => {
    return employees.map((emp) => {
      const recA = records.find(
        (r) => r.employe_id === emp.id && r.mois === compMonthA && r.annee === compYearA
      );
      const recB = records.find(
        (r) => r.employe_id === emp.id && r.mois === compMonthB && r.annee === compYearB
      );

      const netA = recA ? recA.salaire_net : 0;
      const netB = recB ? recB.salaire_net : 0;
      const baseA = recA ? recA.salaire_base : emp.salaire_base;
      const baseB = recB ? recB.salaire_base : emp.salaire_base;
      
      const primesA = recA ? (recA.prime_anciennete || 0) + (recA.prime_responsabilite || 0) + (recA.commission || 0) + (recA.sursalaire || 0) : 0;
      const primesB = recB ? (recB.prime_anciennete || 0) + (recB.prime_responsabilite || 0) + (recB.commission || 0) + (recB.sursalaire || 0) : 0;

      return {
        employee: emp,
        recA,
        recB,
        netA,
        netB,
        baseA,
        baseB,
        primesA,
        primesB,
        diffNet: netB - netA,
        diffBase: baseB - baseA,
        diffPrimes: primesB - primesA,
      };
    });
  }, [employees, records, compMonthA, compYearA, compMonthB, compYearB]);

  // Aggregate stats for comparison of all employees
  const compTotalBaseA = useMemo(() => compareData.reduce((acc, c) => acc + c.baseA, 0), [compareData]);
  const compTotalBaseB = useMemo(() => compareData.reduce((acc, c) => acc + c.baseB, 0), [compareData]);
  const compTotalPrimesA = useMemo(() => compareData.reduce((acc, c) => acc + c.primesA, 0), [compareData]);
  const compTotalPrimesB = useMemo(() => compareData.reduce((acc, c) => acc + c.primesB, 0), [compareData]);
  const compTotalNetA = useMemo(() => compareData.reduce((acc, c) => acc + c.netA, 0), [compareData]);
  const compTotalNetB = useMemo(() => compareData.reduce((acc, c) => acc + c.netB, 0), [compareData]);

  const compareFields = [
    { label: "1. Matricule", key: 'matricule' as any, isString: true, getVal: (emp: Employee) => emp.matricule },
    { label: "2. Nom et Prénoms", key: 'nom_prenoms' as any, isString: true, getVal: (emp: Employee) => `${emp.prenom} ${emp.nom}` },
    { label: "3. Jours travaillés", key: 'jours_travailles' as keyof MonthlyRecord, fallback: 30, format: (v: number) => `${v} jours` },
    { label: "4. Salaire de base", key: 'salaire_base' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "5. Sursalaire", key: 'sursalaire' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "6. Prime d'ancienneté", key: 'prime_anciennete' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "7. Régularisation de prime d'ancienneté", key: 'regularisation_prime_anciennete' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "8. Prime de rendement", key: 'prime_rendement' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "9. Heures supplémentaires (15 %)", key: 'heures_sup_15' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "10. Heures supplémentaires (50 %)", key: 'heures_sup_50' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "11. Heures supplémentaires (75 %)", key: 'heures_sup_75' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "12. Heures supplémentaires (100 %)", key: 'heures_sup_100' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "13. Prime de responsabilité", key: 'prime_responsabilite' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "14. Prime d'entretien de tenue", key: 'prime_entretien_tenue' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "15. Indemnité de logement", key: 'indemnite_logement' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "16. Prime d'intérim", key: 'prime_interim' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "17. Commission", key: 'commission' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "18. Indemnité de congé", key: 'indemnite_conge' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "19. Prime d'encouragement", key: 'prime_encouragement' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "20. Prime d'astreinte", key: 'prime_astreinte' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "21. Gratification", key: 'gratification' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "22. Indemnité de licenciement imposable", key: 'indemnite_licenciement_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "23. Indemnité de fin de contrat imposable", key: 'indemnite_fin_contrat_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "24. Indemnité de préavis", key: 'indemnite_preavis' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "25. Prime de transport imposable", key: 'transport_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "26. Salaire brut provisoire", key: 'salaire_brut_provisoire' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "27. Prime de responsabilité imposable", key: 'prime_responsabilite_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "28. Salaire brut", key: 'salaire_brut' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "29. Réduction d'impôt", key: 'reduction_impot' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "30. Impôt sur les traitements et salaires (ITS)", key: 'impot_montant' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "31. Retraite générale (CNPS)", key: 'cotisations' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "32. Prélèvement CMU", key: 'prelevement_cmu' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "33. Cotisation accidents du travail", key: 'cotisation_accidents_travail' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "34. Prestations familiales", key: 'prestations_familiales' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "35. Taxe d'apprentissage", key: 'taxe_apprentissage' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "36. Taxe de formation professionnelle continue", key: 'taxe_formation_continue' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "37. Remboursement de dette", key: 'remboursement_dette' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "38. Retenue sur salaire", key: 'retenue_sur_salaire' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "39. Retenue RAV", key: 'retenue_rav' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "40. Remboursement d'emprunt", key: 'remboursement_emprunt' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "41. Retenue de caution", key: 'retenue_caution' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "42. Retenues diverses", key: 'retenues_diverses' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "43. Retenue MUALEAN", key: 'retenue_mualean' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "44. Avance sur salaire", key: 'avance_sur_salaire' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "45. Prélèvement portable", key: 'prelevement_portable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "46. Prêt divers", key: 'pret_divers' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "47. Préavis dû à l'employeur", key: 'preavis_du_employeur' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "48. Retenue assurance salarié", key: 'retenue_assurance_salarie' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "49. Prélèvement Moto Plan", key: 'prelevement_moto_plan' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "50. Dommages et intérêts dus à la société", key: 'dommages_interets_societe' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "51. ITS patronal", key: 'its_patronal' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "52. Prime de transport non imposable", key: 'transport_non_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "53. Prime de représentation", key: 'prime_representation' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "54. Prime de responsabilité non imposable", key: 'prime_responsabilite_non_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "55. Indemnité de tenue", key: 'indemnite_tenue' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "56. Indemnité de fin de contrat non imposable", key: 'indemnite_fin_contrat_non_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "57. Indemnité de licenciement non imposable", key: 'indemnite_licenciement_non_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "58. Indemnité transactionnelle", key: 'indemnite_transactionnelle' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "59. Remboursement de caution", key: 'remboursement_caution' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "60. Indemnité de représentation non imposable", key: 'indemnite_representation_non_imposable' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "61. Salaire net", key: 'salaire_net' as keyof MonthlyRecord, fallback: 0, isCurrency: true, highlight: true },
    { label: "62. Prélèvement CMU (part patronale)", key: 'prelevement_cmu_patronal' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
    { label: "63. Cotisations CNPS patronales", key: 'cotisations_cnps_patronales' as keyof MonthlyRecord, fallback: 0, isCurrency: true },
  ];

  // Aggregated data of all 63 fields for the entire company
  const globalCompareFieldsData = useMemo(() => {
    return compareFields.map((field) => {
      const getVal = (field as any).getVal;
      const isString = (field as any).isString;

      if (isString) {
        return {
          field,
          valA: "—" as any,
          valB: "—" as any,
          diff: 0,
          pctVal: 0,
          isString: true
        };
      }

      let sumA = 0;
      let sumB = 0;

      employees.forEach((emp) => {
        const recA = records.find(
          (r) => r.employe_id === emp.id && r.mois === compMonthA && r.annee === compYearA
        );
        const recB = records.find(
          (r) => r.employe_id === emp.id && r.mois === compMonthB && r.annee === compYearB
        );

        const valA = getVal 
          ? getVal(emp) 
          : (recA ? (recA[field.key as keyof MonthlyRecord] ?? field.fallback) : (field.key === 'salaire_base' ? emp.salaire_base : field.fallback));
        const valB = getVal 
          ? getVal(emp) 
          : (recB ? (recB[field.key as keyof MonthlyRecord] ?? field.fallback) : (field.key === 'salaire_base' ? emp.salaire_base : field.fallback));

        sumA += Number(valA ?? 0);
        sumB += Number(valB ?? 0);
      });

      const diff = sumB - sumA;
      let pctVal = 0;
      if (sumA !== 0) {
        pctVal = (diff / sumA) * 100;
      } else if (sumB !== 0) {
        pctVal = sumB > 0 ? 100 : -100;
      }

      return {
        field,
        valA: sumA,
        valB: sumB,
        diff,
        pctVal,
        isString: false
      };
    });
  }, [employees, records, compMonthA, compYearA, compMonthB, compYearB]);

  // Process selected or dropped .xlsx file
  const processExcelFile = (file: File, targetMonth: number, targetYear: number) => {
    setImportError(null);
    setMatchedData([]);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          setImportError("Le fichier Excel ne contient aucune feuille de calcul.");
          return;
        }
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to array of arrays
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length === 0) {
          setImportError("La feuille de calcul Excel est vide.");
          return;
        }

        // Search for header row in first 15 rows
        let headerRowIndex = -1;
        let headers: string[] = [];
        
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const row = rows[i];
          if (Array.isArray(row)) {
            const hasIndicator = row.some(cell => {
              const s = String(cell || '').toLowerCase();
              return s.includes('matricule') || s.includes('nom') || s.includes('salarie') || s.includes('collaborateur') || s.includes('base');
            });
            if (hasIndicator) {
              headerRowIndex = i;
              headers = row.map(cell => String(cell || '').trim());
              break;
            }
          }
        }
        
        if (headerRowIndex === -1) {
          headers = (rows[0] as any[] || []).map(cell => String(cell || '').trim());
          headerRowIndex = 0;
        }

        // Map column headers to keys
        const mappedColumns: { header: string; fieldKey: string; matchedLabel: string }[] = [];
        const headerIndices: Record<string, number> = {};

        const normalizeHeader = (str: string): string => {
          if (!str) return '';
          return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/^\d+[\s\.\-\)_]*/, '')
            .replace(/[^a-z0-9]/g, '')
            .trim();
        };

        const fieldMapping: Record<string, string> = {
          'matricule': 'matricule',
          'mat': 'matricule',
          'nom': 'nom',
          'prenom': 'prenom',
          'prenoms': 'prenom',
          'nometprenoms': 'nom_prenoms',
          'nomsetprenoms': 'nom_prenoms',
          'nomprenoms': 'nom_prenoms',
          'collaborateur': 'nom_prenoms',
          'employe': 'nom_prenoms',
          'salarie': 'nom_prenoms',
          'service': 'service',
          'departement': 'service',
          'poste': 'poste',
          'fonction': 'poste',
          'role': 'poste',
          'sexe': 'sexe',
          'genre': 'sexe',
          'telephone': 'telephone',
          'tel': 'telephone',
          'email': 'email',
          'courriel': 'email',
          'dateembauche': 'date_embauche',
          'dateentree': 'date_embauche',
          'jourstravailles': 'jours_travailles',
          'jours': 'jours_travailles',
          'nbjours': 'jours_travailles',
          'nbrejours': 'jours_travailles',
          'joursactuels': 'jours_travailles',
          'salairedebase': 'salaire_base',
          'salairebase': 'salaire_base',
          'base': 'salaire_base',
          'sb': 'salaire_base',
          'sursalaire': 'sursalaire',
          'sursal': 'sursalaire',
          'primeanciennete': 'prime_anciennete',
          'anciennete': 'prime_anciennete',
          'regularisationprimeanciennete': 'regularisation_prime_anciennete',
          'reguprianc': 'regularisation_prime_anciennete',
          'reguanciennete': 'regularisation_prime_anciennete',
          'primerendement': 'prime_rendement',
          'rendement': 'prime_rendement',
          'heuressupplementaires15': 'heures_sup_15',
          'heuressup15': 'heures_sup_15',
          'hsup15': 'heures_sup_15',
          'heuresup15': 'heures_sup_15',
          'heuressupplementaires50': 'heures_sup_50',
          'heuressup50': 'heures_sup_50',
          'hsup50': 'heures_sup_50',
          'heuresup50': 'heures_sup_50',
          'heuressupplementaires75': 'heures_sup_75',
          'heuressup75': 'heures_sup_75',
          'hsup75': 'heures_sup_75',
          'heuresup75': 'heures_sup_75',
          'heuressupplementaires100': 'heures_sup_100',
          'heuressup100': 'heures_sup_100',
          'hsup100': 'heures_sup_100',
          'heuresup100': 'heures_sup_100',
          'primeresponsabilite': 'prime_responsabilite',
          'responsabilite': 'prime_responsabilite',
          'primeentretenietenue': 'prime_entretien_tenue',
          'entretenietenue': 'prime_entretien_tenue',
          'tenue': 'prime_entretien_tenue',
          'indemnitedelogement': 'indemnite_logement',
          'indemnitelogement': 'indemnite_logement',
          'logement': 'indemnite_logement',
          'primeinterim': 'prime_interim',
          'interim': 'prime_interim',
          'commission': 'commission',
          'commissions': 'commission',
          'com': 'commission',
          'indemnitedeconge': 'indemnite_conge',
          'indemniteconge': 'indemnite_conge',
          'conge': 'indemnite_conge',
          'primeencouragement': 'prime_encouragement',
          'encouragement': 'prime_encouragement',
          'primeastreinte': 'prime_astreinte',
          'astreinte': 'prime_astreinte',
          'gratification': 'gratification',
          'gratifications': 'gratification',
          'indemnitedelicenciementimposable': 'indemnite_licenciement_imposable',
          'indemnitelicenciementimposable': 'indemnite_licenciement_imposable',
          'indemnitedefindecontratimposable': 'indemnite_fin_contrat_imposable',
          'indemnitefincontratimposable': 'indemnite_fin_contrat_imposable',
          'indemnitedepreavis': 'indemnite_preavis',
          'indemnitepreavis': 'indemnite_preavis',
          'preavis': 'indemnite_preavis',
          'primedetransportimposable': 'transport_imposable',
          'transportimposable': 'transport_imposable',
          'primetransportimposable': 'transport_imposable',
          'salairebrutprovisoire': 'salaire_brut_provisoire',
          'brutprovisoire': 'salaire_brut_provisoire',
          'primeresponsabiliteimposable': 'prime_responsabilite_imposable',
          'responsabiliteimposable': 'prime_responsabilite_imposable',
          'salairebrut': 'salaire_brut',
          'brut': 'salaire_brut',
          'brutglobal': 'salaire_brut',
          'totalbrut': 'salaire_brut',
          'reductiondimpot': 'reduction_impot',
          'reductionimpot': 'reduction_impot',
          'impotsurlesitraitementsetsalairesits': 'impot_montant',
          'impotsurlesitraitementsetsalaires': 'impot_montant',
          'impotsurlesalaires': 'impot_montant',
          'its': 'impot_montant',
          'impotits': 'impot_montant',
          'impotmontant': 'impot_montant',
          'impots': 'impot_montant',
          'retraitegeneralecnps': 'cotisations',
          'cnps': 'cotisations',
          'cotisationscnps': 'cotisations',
          'cotisations': 'cotisations',
          'retraitegenerale': 'cotisations',
          'prelevementcmu': 'prelevement_cmu',
          'cmu': 'prelevement_cmu',
          'cotisationcmu': 'prelevement_cmu',
          'cotisationaccidentstravail': 'cotisation_accidents_travail',
          'accidentstravail': 'cotisation_accidents_travail',
          'prestationsfamiliales': 'prestations_familiales',
          'taxedapprentissage': 'taxe_apprentissage',
          'taxeapprentissage': 'taxe_apprentissage',
          'taxedeformationprofessionnellecontinue': 'taxe_formation_continue',
          'taxeformationprofessionnellecontinue': 'taxe_formation_continue',
          'taxeformationcontinue': 'taxe_formation_continue',
          'remboursementdedette': 'remboursement_dette',
          'remboursementdette': 'remboursement_dette',
          'dette': 'remboursement_dette',
          'retenuesursalaire': 'retenue_sur_salaire',
          'retenuesalaire': 'retenue_sur_salaire',
          'retenuerav': 'retenue_rav',
          'rav': 'retenue_rav',
          'remboursementdemprunt': 'remboursement_emprunt',
          'remboursementemprunt': 'remboursement_emprunt',
          'emprunt': 'remboursement_emprunt',
          'retenuedecaution': 'retenue_caution',
          'retenuedevaluation': 'retenue_caution',
          'retenuecaution': 'retenue_caution',
          'retenuesdiverses': 'retenues_diverses',
          'diversesretenues': 'retenues_diverses',
          'retenuemualean': 'retenue_mualean',
          'mualean': 'retenue_mualean',
          'avancesursalaire': 'avance_sur_salaire',
          'avancesalaire': 'avance_sur_salaire',
          'avance': 'avance_sur_salaire',
          'prelevementportable': 'prelevement_portable',
          'portable': 'prelevement_portable',
          'pretdivers': 'pret_divers',
          'pret': 'pret_divers',
          'preavisduemployeur': 'preavis_du_employeur',
          'preavisemployeur': 'preavis_du_employeur',
          'retenueassurancesalarie': 'retenue_assurance_salarie',
          'assurancesalarie': 'retenue_assurance_salarie',
          'prelevementmotoplan': 'prelevement_moto_plan',
          'motoplan': 'prelevement_moto_plan',
          'dommagesetinteretsdusalasociete': 'dommages_interets_societe',
          'dommagesinteretssociete': 'dommages_interets_societe',
          'itspatronal': 'its_patronal',
          'primedetransportnonimposable': 'transport_non_imposable',
          'transportnonimposable': 'transport_non_imposable',
          'primetransportnonimposable': 'transport_non_imposable',
          'primederepresentation': 'prime_representation',
          'primerepresentation': 'prime_representation',
          'representation': 'prime_representation',
          'primeresponsabilitenonimposable': 'prime_responsabilite_non_imposable',
          'responsabilitenonimposable': 'prime_responsabilite_non_imposable',
          'indemnitetenue': 'indemnite_tenue',
          'tenue_non_imposable': 'indemnite_tenue',
          'indemnitedefindecontratnonimposable': 'indemnite_fin_contrat_non_imposable',
          'indemnitefincontratnonimposable': 'indemnite_fin_contrat_non_imposable',
          'indemnitedelicenciementnonimposable': 'indemnite_licenciement_non_imposable',
          'indemnitelicenciementnonimposable': 'indemnite_licenciement_non_imposable',
          'indemnitetransactionnelle': 'indemnite_transactionnelle',
          'remboursementdecaution': 'remboursement_caution',
          'remboursementcaution': 'remboursement_caution',
          'indemnitederepresentationnonimposable': 'indemnite_representation_non_imposable',
          'indemniterepresentationnonimposable': 'indemnite_representation_non_imposable',
          'salairenet': 'salaire_net',
          'net': 'salaire_net',
          'netapayer': 'salaire_net',
          'salairenetapayer': 'salaire_net',
          'netpaye': 'salaire_net',
          'prelevementcmupartpatronale': 'prelevement_cmu_patronal',
          'prelevementcmupatronal': 'prelevement_cmu_patronal',
          'cmupatronal': 'prelevement_cmu_patronal',
          'cotisationscnpspatronales': 'cotisations_cnps_patronales',
          'cnpspatronales': 'cotisations_cnps_patronales'
        };

        headers.forEach((h, index) => {
          if (!h) return;
          const norm = normalizeHeader(h);
          const mappedKey = fieldMapping[norm];
          if (mappedKey) {
            headerIndices[mappedKey] = index;
            const matchedFld = compareFields.find(f => f.key === mappedKey);
            mappedColumns.push({
              header: h,
              fieldKey: mappedKey,
              matchedLabel: matchedFld ? matchedFld.label : mappedKey
            });
          }
        });

        // Ensure we mapped at least Matricule or Name
        if (headerIndices['matricule'] === undefined && headerIndices['nom_prenoms'] === undefined && headerIndices['nom'] === undefined) {
          setImportError("Impossible d'identifier les colonnes obligatoires (Matricule ou Nom). Veuillez vérifier votre fichier.");
          return;
        }

        setColumnsMapped(mappedColumns);

        const parsed: any[] = [];
        const parseExcelNumber = (val: any): number => {
          if (val === undefined || val === null || val === '') return 0;
          if (typeof val === 'number') return val;
          const clean = String(val)
            .replace(/[^\d\.,\-]/g, '')
            .replace(/,/g, '.');
          const num = parseFloat(clean);
          return isNaN(num) ? 0 : num;
        };

        for (let j = headerRowIndex + 1; j < rows.length; j++) {
          const row = rows[j];
          if (!row || !Array.isArray(row) || row.every(cell => cell === null || cell === '')) {
            continue;
          }

          const getCellRaw = (key: string) => {
            const idx = headerIndices[key];
            return idx !== undefined ? row[idx] : undefined;
          };

          const rawMatricule = String(getCellRaw('matricule') || '').trim();
          const rawNomPrenoms = String(getCellRaw('nom_prenoms') || '').trim();
          const rawNom = String(getCellRaw('nom') || '').trim();
          const rawPrenom = String(getCellRaw('prenom') || '').trim();

          if (!rawMatricule && !rawNomPrenoms && !rawNom && !rawPrenom) {
            continue;
          }

          let matchedEmp = employees.find(emp => {
            if (rawMatricule && emp.matricule.toLowerCase().trim() === rawMatricule.toLowerCase()) {
              return true;
            }
            const empFullName = `${emp.prenom} ${emp.nom}`.toLowerCase().trim();
            if (rawNomPrenoms && empFullName === rawNomPrenoms.toLowerCase()) {
              return true;
            }
            if (rawNom && rawPrenom && emp.nom.toLowerCase().trim() === rawNom.toLowerCase() && emp.prenom.toLowerCase().trim() === rawPrenom.toLowerCase()) {
              return true;
            }
            return false;
          });

          const isNew = !matchedEmp;
          let employeeCandidate: Employee;

          const splitNames = rawNomPrenoms ? rawNomPrenoms.split(/\s+/) : [];
          const computedPrenom = rawPrenom || splitNames[0] || 'Prénom';
          const computedNom = rawNom || splitNames.slice(1).join(' ') || 'Nom';

          if (matchedEmp) {
            employeeCandidate = { ...matchedEmp };
          } else {
            employeeCandidate = {
              id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              matricule: rawMatricule || `MAT-${Math.floor(1000 + Math.random() * 9000)}`,
              nom: computedNom,
              prenom: computedPrenom,
              sexe: 'M',
              date_naissance: '1990-01-01',
              telephone: String(getCellRaw('telephone') || ''),
              email: String(getCellRaw('email') || ''),
              service: String(getCellRaw('service') || 'Services Généraux'),
              poste: String(getCellRaw('poste') || 'Employé'),
              responsable: 'Direction',
              date_embauche: String(getCellRaw('date_embauche') || new Date().toISOString().split('T')[0]),
              salaire_base: parseExcelNumber(getCellRaw('salaire_base')) || 350000,
              statut: 'Actif',
            };
          }

          const recordCandidate: any = {
            id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            employe_id: employeeCandidate.id,
            mois: targetMonth,
            annee: targetYear,
            observation: 'Importé via fichier Excel (.xlsx)',
            chiffre_affaires: 0,
            ventes_count: 0,
            ventes_objectif: 0,
            taux_tva: settings.taux_tva,
            taux_cnps: settings.taux_cnps,
            taux_impot: settings.taux_impot,
            taux_retenues: settings.taux_retenues,
            taux_assurances: settings.taux_assurances,
            taxes_montant: 0,
          };

          let fieldsCount = 0;
          Object.keys(headerIndices).forEach(fieldKey => {
            if (['matricule', 'nom', 'prenom', 'nom_prenoms', 'service', 'poste', 'sexe', 'telephone', 'email', 'date_embauche'].includes(fieldKey)) {
              return;
            }
            const rawVal = getCellRaw(fieldKey);
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
              const numVal = parseExcelNumber(rawVal);
              recordCandidate[fieldKey] = numVal;
              fieldsCount++;
            }
          });

          if (recordCandidate.jours_travailles === undefined) {
            recordCandidate.jours_travailles = 30;
          }
          if (recordCandidate.salaire_base === undefined || recordCandidate.salaire_base === 0) {
            recordCandidate.salaire_base = employeeCandidate.salaire_base;
          }

          // Compute/Derive fields
          const baseSal = recordCandidate.salaire_base || 0;
          const sursal = recordCandidate.sursalaire || 0;
          const primeAnc = recordCandidate.prime_anciennete || 0;
          const primeResp = recordCandidate.prime_responsabilite || 0;
          const indLog = recordCandidate.indemnite_logement || 0;
          const comm = recordCandidate.commission || 0;
          const transImp = recordCandidate.transport_imposable || recordCandidate.prime_transport_imposable || 0;
          const transNonImp = recordCandidate.transport_non_imposable || recordCandidate.prime_transport_non_imposable || 0;
          
          const cotis = recordCandidate.cotisations || 0;
          const imp = recordCandidate.impot_montant || 0;
          const retDiv = recordCandidate.retenues_diverses || 0;

          if (recordCandidate.salaire_net === undefined || recordCandidate.salaire_net === 0) {
            const brutImp = baseSal + sursal + primeAnc + primeResp + indLog + comm + transImp;
            const deduc = cotis + imp + retDiv;
            recordCandidate.salaire_net = Math.round(Math.max(0, brutImp + transNonImp - deduc));
          } else {
            recordCandidate.salaire_net = Math.round(parseExcelNumber(getCellRaw('salaire_net')));
          }

          recordCandidate.prime = primeAnc + primeResp + comm;
          recordCandidate.bonus = sursal;

          parsed.push({
            employeeId: matchedEmp ? matchedEmp.id : null,
            isNewEmployee: isNew,
            employeeCandidate,
            recordCandidate,
            fieldsCount,
            nomPrenomsText: rawNomPrenoms || `${computedPrenom} ${computedNom}`,
            matriculeText: rawMatricule || employeeCandidate.matricule,
          });
        }

        if (parsed.length === 0) {
          setImportError("Aucune donnée d'employé valide n'a pu être extraite.");
        } else {
          setMatchedData(parsed);
        }

      } catch (err: any) {
        setImportError(`Erreur lors du traitement du fichier: ${err.message || err}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Download Excel template with the exact columns and headers for easy import mapping
  const downloadTemplateExcel = () => {
    try {
      const headers = [
        "Matricule", "Nom", "Prénom", "Sexe", "Téléphone", "Email", "Service", "Poste", "Date Embauche",
        "Salaire de Base", "Jours Travaillés", "Sursalaire", "Prime d'Ancienneté", "Régularisation Prime d'Ancienneté",
        "Prime de Rendement", "Heures Sup 15%", "Heures Sup 50%", "Heures Sup 75%", "Heures Sup 100%",
        "Prime de Responsabilité", "Prime d'Entretien de Tenue", "Indemnité de Logement", "Prime d'Intérim",
        "Commission", "Indemnité de Congé", "Prime d'Encouragement", "Prime d'Astreinte", "Gratification",
        "Indemnité de Licenciement Imposable", "Indemnité de Fin de Contrat Imposable", "Indemnité de Préavis",
        "Prime de Transport Imposable", "Salaire Brut", "Réduction d'Impôt", "Impôt ITS", "Cotisations CNPS",
        "Prélèvement CMU", "Cotisation Accidents de Travail", "Prestations Familiales", "Taxe d'Apprentissage",
        "Taxe de Formation Continue", "Remboursement de Dette", "Retenue sur Salaire", "Retenue RAV",
        "Remboursement d'Emprunt", "Retenue de Caution", "Retenues Diverses", "Retenue MUALEAN",
        "Avance sur Salaire", "Prélèvement Portable", "Prêt Divers", "Préavis dû Employeur",
        "Retenue Assurance Salarié", "Prélèvement Moto Plan", "Dommages et Intérêts Société", "ITS Patronal",
        "Prime de Transport Non Imposable", "Prime de Représentation", "Prime de Responsabilité Non Imposable",
        "Indemnité de Tenue", "Indemnité de Fin de Contrat Non Imposable", "Indemnité de Licenciement Non Imposable",
        "Indemnité Transactionnelle", "Remboursement de Caution", "Indemnité de Représentation Non Imposable",
        "Salaire Net", "Prélèvement CMU Patronal", "Cotisations CNPS Patronales"
      ];

      // Generate sample rows based on existing employees, or defaults if empty
      const rows = employees.length > 0 
        ? employees.slice(0, 5).map(emp => [
            emp.matricule,
            emp.nom,
            emp.prenom,
            emp.sexe,
            emp.telephone,
            emp.email,
            emp.service,
            emp.poste,
            emp.date_embauche,
            emp.salaire_base,
            30, // Jours Travaillés
            0,  // Sursalaire
            15000, // Prime d'Ancienneté (exemple)
            0,
            10000, // Prime de Rendement
            0, 0, 0, 0, // Heures sup
            0, 0, 50000, 0, // Indemnités/primes
            0, 0, 0, 0, 0, // Commission, etc.
            0, 0, 0,
            25000, // Prime de transport imposable
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            30000, // Transport non imposable
            0, 0, 0, 0, 0, 0, 0, 0,
            0, // Salaire net (will be calculated or imported)
            0, 0
          ])
        : [
            [
              "MAT-001", "Koffi", "Kouamé", "M", "+225 01020304", "koffi.kouame@example.com", "Direction", "Directeur Technique", "2020-01-15",
              850000, 30, 100000, 45000, 0, 0, 0, 0, 0, 0, 50000, 0, 150000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 50000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ],
            [
              "MAT-002", "Yao", "Aya Marie", "F", "+225 05060708", "aya.yao@example.com", "Ressources Humaines", "Chargée RH", "2021-09-01",
              450000, 30, 0, 20000, 0, 15000, 2, 0, 0, 0, 0, 0, 75000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 25000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 35000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
            ]
          ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Livre de Paie");

      // Write and download
      XLSX.writeFile(workbook, `modele_import_paie_${importMonth}_${importYear}.xlsx`);
      
      onAddLog(
        'Téléchargement de modèle',
        `Modèle de fichier d'importation Excel .xlsx généré avec succès pour la période ${getMonthName(importMonth)} ${importYear}.`
      );
    } catch (err: any) {
      setImportError(`Erreur lors de la génération du modèle: ${err.message || err}`);
    }
  };

  const handleConfirmImport = () => {
    if (matchedData.length === 0) return;

    // Save newly created employees
    const newEmployeesToSave: Employee[] = [];
    matchedData.forEach(item => {
      if (item.isNewEmployee) {
        newEmployeesToSave.push(item.employeeCandidate);
      }
    });

    if (newEmployeesToSave.length > 0) {
      setEmployees(prev => {
        const updated = [...prev];
        newEmployeesToSave.forEach(newEmp => {
          if (!updated.some(e => e.matricule === newEmp.matricule)) {
            updated.push(newEmp);
          }
        });
        return updated;
      });
    }

    // Upsert Monthly Records
    setRecords(prev => {
      const updated = [...prev];
      matchedData.forEach(item => {
        const candidate = item.recordCandidate;
        const finalEmployeeId = item.isNewEmployee ? item.employeeCandidate.id : candidate.employe_id;
        
        const existingIdx = updated.findIndex(r => 
          r.employe_id === finalEmployeeId && r.mois === importMonth && r.annee === importYear
        );

        const preparedCandidate = {
          ...candidate,
          employe_id: finalEmployeeId,
          mois: importMonth,
          annee: importYear
        };

        if (existingIdx > -1) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            ...preparedCandidate
          };
        } else {
          updated.push(preparedCandidate);
        }
      });
      return updated;
    });

    onAddLog(
      'Importation Excel .xlsx',
      `Importation réussie de ${matchedData.length} fiches de paie pour la période ${getMonthName(importMonth)} ${importYear}.`
    );

    // Reset and close
    setShowImportModal(false);
    setMatchedData([]);
    setColumnsMapped([]);
    setImportError(null);
  };

  const currentCompEmployee = useMemo(() => {
    return employees.find((emp) => emp.id === compEmpId);
  }, [employees, compEmpId]);

  return (
    <div className="space-y-6 text-xs font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Rémunérations & Livre de Paie
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez la paie globale et comparez les variations de salaires et primes mois par mois.
          </p>
        </div>

        {activeTab === 'saisie' && (
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-import-payroll-xlsx"
              onClick={() => {
                setImportError(null);
                setMatchedData([]);
                setShowImportModal(true);
              }}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Importer .XLSX / Excel</span>
            </button>
            <button
              id="btn-export-payroll-csv"
              onClick={handleExportMonthSummary}
              className="flex items-center justify-center gap-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-zinc-800 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exporter le Récap CSV</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-1.5 rounded-2xl">
        <button
          id="btn-tab-saisie"
          onClick={() => setActiveTab('saisie')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'saisie'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-zinc-500 hover:text-zinc-850 hover:bg-zinc-50'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Saisie & Livre de Paie</span>
        </button>
        <button
          id="btn-tab-compare"
          onClick={() => setActiveTab('compare')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all ${
            activeTab === 'compare'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/10'
              : 'text-zinc-500 hover:text-zinc-850 hover:bg-zinc-50'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Comparateur de Mois 📊</span>
        </button>
      </div>

      {/* VIEW 1: Saisie & Livre de Paie */}
      {activeTab === 'saisie' && (
        <div className="space-y-6">
          {/* Control bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4 animate-fade-in">
            {/* Period selection */}
            <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
              <Calendar className="w-4 h-4 text-zinc-400" />
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">Période :</span>
              <select
                id="payroll-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-850 dark:text-zinc-200"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {getMonthName(m)}
                  </option>
                ))}
              </select>

              <select
                id="payroll-year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-850 dark:text-zinc-200"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
              </select>
            </div>

            {/* Live Search */}
            <div className="relative w-full md:flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                id="payroll-search-input"
                type="text"
                placeholder="Rechercher un employé pour saisir sa paie..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>

          {/* Main Table Grid */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                    <th className="py-3 px-4">Salarié(e)</th>
                    <th className="py-3 px-4">Poste & Service</th>
                    <th className="py-3 px-4">Salaire Base</th>
                    <th className="py-3 px-4">Saisie Actuelle</th>
                    <th className="py-3 px-4">Sursalaire / Primes</th>
                    <th className="py-3 px-4">Salaire Net</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/85">
                  {gridData.map(({ employee, record }) => {
                    const isComplete = !!record;

                    return (
                      <tr
                        id={`payroll-manager-row-${employee.id}`}
                        key={employee.id}
                        className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-300 transition-colors text-xs"
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-bold text-zinc-900 dark:text-white">
                                {employee.prenom} {employee.nom}
                              </p>
                              <p className="text-[10px] text-zinc-400 font-mono">{employee.matricule}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-medium">{employee.poste}</p>
                          <p className="text-[10px] text-zinc-400">{employee.service}</p>
                        </td>

                        <td className="py-3.5 px-4 font-semibold">
                          {formatCurrency(employee.salaire_base, settings.devise)}
                        </td>

                        <td className="py-3.5 px-4">
                          {isComplete ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Saisie validée</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                              <AlertCircle className="w-3 h-3" />
                              <span>Attente saisie</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {record && (record.prime ?? 0) + (record.bonus ?? 0) > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                              +{formatCurrency((record.prime ?? 0) + (record.bonus ?? 0), settings.devise)}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-extrabold text-zinc-900 dark:text-white">
                          {record ? formatCurrency(record.salaire_net, settings.devise) : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canEdit ? (
                            <button
                              id={`btn-manage-payroll-emp-${employee.id}`}
                              onClick={() => handleOpenForm(employee, record)}
                              className="inline-flex items-center gap-1 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:border-zinc-750 text-zinc-800 dark:text-zinc-100 font-bold px-2.5 py-1.5 rounded-xl transition-all"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>{record ? 'Modifier' : 'Saisir'}</span>
                            </button>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">Lecture seule</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Comparateur de Mois 📊 */}
      {activeTab === 'compare' && (
        <div className="space-y-6 animate-fade-in">
          {/* Comparison controls */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-600" />
              <span>Paramètres de comparaison de paie</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Period A */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Mois de Référence (A)</label>
                <div className="flex gap-2">
                  <select
                    id="comp-month-a"
                    value={compMonthA}
                    onChange={(e) => setCompMonthA(Number(e.target.value))}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                  <select
                    id="comp-year-a"
                    value={compYearA}
                    onChange={(e) => setCompYearA(Number(e.target.value))}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              {/* Arrow spacer */}
              <div className="hidden md:flex justify-center pb-2.5">
                <ArrowLeftRight className="w-5 h-5 text-zinc-400 shrink-0" />
              </div>

              {/* Period B */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Mois Comparé (B)</label>
                <div className="flex gap-2">
                  <select
                    id="comp-month-b"
                    value={compMonthB}
                    onChange={(e) => setCompMonthB(Number(e.target.value))}
                    className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>{getMonthName(m)}</option>
                    ))}
                  </select>
                  <select
                    id="comp-year-b"
                    value={compYearB}
                    onChange={(e) => setCompYearB(Number(e.target.value))}
                    className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={2026}>2026</option>
                    <option value={2025}>2025</option>
                  </select>
                </div>
              </div>

              {/* Employee filter selection */}
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1.5">Périmètre Salarié</label>
                <select
                  id="comp-employee-id"
                  value={compEmpId}
                  onChange={(e) => setCompEmpId(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">Tous les employés (Vue Globale)</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>{e.prenom} {e.nom} ({e.matricule})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* GLOBAL VIEW FOR ALL EMPLOYEES */}
          {compEmpId === 'all' ? (
            <div className="space-y-6">
              {/* MoM difference summary metrics cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Base Salary Mass */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Écart Salaries de Base</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
                      {formatCurrency(compTotalBaseB - compTotalBaseA, settings.devise)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[10px]">
                    <span className="text-zinc-500">
                      Mois A: {formatCurrency(compTotalBaseA, settings.devise)} • Mois B: {formatCurrency(compTotalBaseB, settings.devise)}
                    </span>
                  </div>
                </div>

                {/* Card 2: Primes & Sursalaire Mass */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Écart Primes / Sursalaire</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-xl font-extrabold ${compTotalPrimesB - compTotalPrimesA >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {compTotalPrimesB - compTotalPrimesA >= 0 ? '+' : ''}{formatCurrency(compTotalPrimesB - compTotalPrimesA, settings.devise)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[10px]">
                    <span className="text-zinc-500">
                      Mois A: {formatCurrency(compTotalPrimesA, settings.devise)} • Mois B: {formatCurrency(compTotalPrimesB, settings.devise)}
                    </span>
                  </div>
                </div>

                {/* Card 3: Net Salary Mass */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Écart Masse Salariale Net</span>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className={`text-xl font-extrabold ${compTotalNetB - compTotalNetA >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {compTotalNetB - compTotalNetA >= 0 ? '+' : ''}{formatCurrency(compTotalNetB - compTotalNetA, settings.devise)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5 text-[10px]">
                    <span className="text-zinc-500">
                      Mois A: {formatCurrency(compTotalNetA, settings.devise)} • Mois B: {formatCurrency(compTotalNetB, settings.devise)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Inner toggle for Vue Globale */}
              <div className="flex border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-1.5 rounded-2xl w-fit">
                <button
                  type="button"
                  onClick={() => setGlobalCompareTab('employees')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    globalCompareTab === 'employees'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-850'
                      : 'text-zinc-500 hover:text-zinc-850'
                  }`}
                >
                  Comparatif par salarié
                </button>
                <button
                  type="button"
                  onClick={() => setGlobalCompareTab('rubrics')}
                  className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                    globalCompareTab === 'rubrics'
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-zinc-850'
                      : 'text-zinc-500 hover:text-zinc-850'
                  }`}
                >
                  Livre de paie global (63 rubriques)
                </button>
              </div>

              {globalCompareTab === 'employees' ? (
                /* Comparison list table of Net pay for each employee */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-4">Livre de Paie Comparatif - Tableau des écarts</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-150 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                          <th className="py-3 px-4">Salarié</th>
                          <th className="py-3 px-4">Service</th>
                          <th className="py-3 px-4">Salaire Net (Mois A)</th>
                          <th className="py-3 px-4">Salaire Net (Mois B)</th>
                          <th className="py-3 px-4 text-right">Écart Net (B - A)</th>
                          <th className="py-3 px-4 text-right">Écart %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/85">
                        {compareData.map(({ employee, netA, netB, diffNet }) => {
                          const pctNet = netA === 0 ? (netB > 0 ? 100 : 0) : ((netB - netA) / netA) * 100;
                          return (
                            <tr
                              key={employee.id}
                              className="hover:bg-zinc-50/40 dark:hover:bg-zinc-900/35 text-zinc-700 dark:text-zinc-300 transition-colors text-xs"
                            >
                              <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-white">
                                {employee.prenom} {employee.nom}
                                <p className="text-[10px] text-zinc-400 font-mono font-normal">{employee.matricule}</p>
                              </td>
                              <td className="py-3.5 px-4 text-zinc-500">{employee.service}</td>
                              <td className="py-3.5 px-4 font-semibold">{formatCurrency(netA, settings.devise)}</td>
                              <td className="py-3.5 px-4 font-semibold">{formatCurrency(netB, settings.devise)}</td>
                              <td className="py-3.5 px-4 text-right">
                                {diffNet === 0 ? (
                                  <span className="inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                                    Stable (0)
                                  </span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 font-extrabold px-2 py-0.5 rounded-lg text-[10px] ${
                                    diffNet > 0
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                  }`}>
                                    {diffNet > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                    <span>{diffNet > 0 ? '+' : ''}{formatCurrency(diffNet, settings.devise)}</span>
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-right font-bold">
                                {diffNet === 0 ? (
                                  <span className="text-zinc-400 italic font-medium">0.0%</span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                                    diffNet > 0
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                  }`}>
                                    {diffNet > 0 ? '+' : ''}{pctNet.toFixed(1)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Global 63 rubrics summary ledger with percentage deviations */
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white">
                        Analyse globale des 63 rubriques de paie
                      </h4>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        Comparaison des masses salariales cumulées par rubrique de paie
                      </p>
                    </div>
                    <span className="text-[10px] text-zinc-600 dark:text-zinc-300 bg-blue-50 dark:bg-blue-950/30 border border-blue-150 dark:border-blue-900 px-3 py-1 rounded-xl font-semibold">
                      Somme cumulée ({employees.length} collaborateurs)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                          <th className="py-3 px-4">Rubrique de paie</th>
                          <th className="py-3 px-4">{getMonthName(compMonthA)} {compYearA} (A)</th>
                          <th className="py-3 px-4">{getMonthName(compMonthB)} {compYearB} (B)</th>
                          <th className="py-3 px-4 text-right">Variation Absolue</th>
                          <th className="py-3 px-4 text-right">Variation (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/85">
                        {globalCompareFieldsData.map(({ field, valA, valB, diff, pctVal, isString }) => {
                          const isHighlight = field.highlight;
                          return (
                            <tr
                              key={field.label}
                              className={`transition-colors ${
                                isHighlight 
                                  ? 'bg-blue-50/50 hover:bg-blue-50/70 dark:bg-blue-950/15 dark:hover:bg-blue-950/20 font-bold text-sm text-zinc-900 dark:text-white border-y-2 border-blue-100 dark:border-blue-900/60' 
                                  : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-900/35 text-zinc-700 dark:text-zinc-300 text-xs'
                              }`}
                            >
                              <td className="py-4 px-4 font-semibold">{field.label}</td>
                              <td className="py-4 px-4">
                                {isString ? valA : (field.isCurrency ? formatCurrency(Number(valA ?? 0), settings.devise) : (field.format ? field.format(Number(valA ?? 0)) : valA))}
                              </td>
                              <td className="py-4 px-4">
                                {isString ? valB : (field.isCurrency ? formatCurrency(Number(valB ?? 0), settings.devise) : (field.format ? field.format(Number(valB ?? 0)) : valB))}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {isString ? (
                                  <span className="text-zinc-400 italic font-medium">—</span>
                                ) : diff === 0 ? (
                                  <span className="text-zinc-400 italic font-medium">Inchangé (0)</span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 font-bold ${
                                    diff > 0 
                                      ? 'text-emerald-600 dark:text-emerald-400' 
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {diff > 0 ? '▲' : '▼'}{' '}
                                    {field.isCurrency ? formatCurrency(Math.abs(diff), settings.devise) : Math.abs(diff)}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {isString ? (
                                  <span className="text-zinc-400 italic font-medium">—</span>
                                ) : diff === 0 ? (
                                  <span className="text-zinc-400 italic font-medium">0.0%</span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                                    pctVal > 0 
                                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                  }`}>
                                    {pctVal > 0 ? '+' : ''}{pctVal.toFixed(1)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* DETAILED VIEW FOR SPECIFIC EMPLOYEE */
            <div className="space-y-6">
              {currentCompEmployee && (() => {
                const recA = records.find(
                  (r) => r.employe_id === currentCompEmployee.id && r.mois === compMonthA && r.annee === compYearA
                );
                const recB = records.find(
                  (r) => r.employe_id === currentCompEmployee.id && r.mois === compMonthB && r.annee === compYearB
                );
                return (
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
                  {/* Employee identity card */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-5 border-b border-zinc-150 dark:border-zinc-800 gap-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <h4 className="text-base font-extrabold text-zinc-900 dark:text-white">
                          {currentCompEmployee.prenom} {currentCompEmployee.nom}
                        </h4>
                        <p className="text-xs text-zinc-400">{currentCompEmployee.poste} • <span className="font-mono">{currentCompEmployee.matricule}</span></p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-3.5 py-2 rounded-xl border border-blue-100 dark:border-blue-900">
                      <ArrowLeftRight className="w-4 h-4 shrink-0" />
                      <span className="font-bold">
                        Analyse comparative {getMonthName(compMonthA)} {compYearA} ➜ {getMonthName(compMonthB)} {compYearB}
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto mt-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-semibold text-[10px]">
                          <th className="py-3 px-4 text-left">Rubrique de paie</th>
                          <th className="py-3 px-4 text-left">{getMonthName(compMonthA)} {compYearA} (A)</th>
                          <th className="py-3 px-4 text-left">{getMonthName(compMonthB)} {compYearB} (B)</th>
                          <th className="py-3 px-4 text-right">Variation Absolue</th>
                          <th className="py-3 px-4 text-right">Variation (%)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/85">
                        {compareFields.map((field) => {
                          const getVal = (field as any).getVal;
                          const isString = (field as any).isString;

                          const valA = getVal 
                            ? getVal(currentCompEmployee) 
                            : (recA ? (recA[field.key as keyof MonthlyRecord] ?? field.fallback) : (field.key === 'salaire_base' ? currentCompEmployee.salaire_base : field.fallback));
                          const valB = getVal 
                            ? getVal(currentCompEmployee) 
                            : (recB ? (recB[field.key as keyof MonthlyRecord] ?? field.fallback) : (field.key === 'salaire_base' ? currentCompEmployee.salaire_base : field.fallback));
                          
                          const diff = isString ? 0 : Number(valB ?? 0) - Number(valA ?? 0);

                          // Style highlight for the Net pay row
                          const isHighlight = field.highlight;

                          return (
                            <tr
                              key={field.label}
                              className={`transition-colors ${
                                isHighlight 
                                  ? 'bg-blue-50/50 hover:bg-blue-50/70 dark:bg-blue-950/15 dark:hover:bg-blue-950/20 font-bold text-sm text-zinc-900 dark:text-white border-y-2 border-blue-100 dark:border-blue-900/60' 
                                  : 'hover:bg-zinc-50/40 dark:hover:bg-zinc-900/35 text-zinc-700 dark:text-zinc-300 text-xs'
                              }`}
                            >
                              <td className="py-4 px-4 font-semibold">{field.label}</td>
                              <td className="py-4 px-4">
                                {isString ? valA : (field.isCurrency ? formatCurrency(Number(valA ?? 0), settings.devise) : (field.format ? field.format(Number(valA ?? 0)) : valA))}
                              </td>
                              <td className="py-4 px-4">
                                {isString ? valB : (field.isCurrency ? formatCurrency(Number(valB ?? 0), settings.devise) : (field.format ? field.format(Number(valB ?? 0)) : valB))}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {isString ? (
                                  <span className="text-zinc-400 italic font-medium">—</span>
                                ) : diff === 0 ? (
                                  <span className="text-zinc-400 italic font-medium">Inchangé (0)</span>
                                ) : (
                                  <span className={`inline-flex items-center gap-1 font-bold ${
                                    diff > 0 
                                      ? 'text-emerald-600 dark:text-emerald-400' 
                                      : 'text-rose-600 dark:text-rose-400'
                                  }`}>
                                    {diff > 0 ? '▲' : '▼'}{' '}
                                    {field.isCurrency ? formatCurrency(Math.abs(diff), settings.devise) : Math.abs(diff)}
                                  </span>
                                )}
                              </td>
                              <td className="py-4 px-4 text-right">
                                {isString ? (
                                  <span className="text-zinc-400 italic font-medium">—</span>
                                ) : diff === 0 ? (
                                  <span className="text-zinc-400 italic font-medium">0.0%</span>
                                ) : (() => {
                                  const numA = Number(valA ?? 0);
                                  const numB = Number(valB ?? 0);
                                  let pctVal = 0;
                                  if (numA !== 0) {
                                    pctVal = (diff / numA) * 100;
                                  } else if (numB !== 0) {
                                    pctVal = numB > 0 ? 100 : -100;
                                  }
                                  return (
                                    <span className={`inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-lg text-[10px] ${
                                      pctVal > 0 
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' 
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400'
                                    }`}>
                                      {pctVal > 0 ? '+' : ''}{pctVal.toFixed(1)}%
                                    </span>
                                  );
                                })()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Observations block */}
                  <div className="mt-8 bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                    <h5 className="font-bold text-xs text-zinc-800 dark:text-zinc-200 mb-2">Observations de comparaison</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-zinc-500">
                      <div>
                        <span className="font-semibold block text-zinc-700 dark:text-zinc-300">{getMonthName(compMonthA)} {compYearA} :</span>
                        <p className="italic mt-1">"{recA?.observation || 'Aucune observation enregistrée.'}"</p>
                      </div>
                      <div>
                        <span className="font-semibold block text-zinc-700 dark:text-zinc-300">{getMonthName(compMonthB)} {compYearB} :</span>
                        <p className="italic mt-1">"{recB?.observation || 'Aucune observation enregistrée.'}"</p>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Saisie Modal popup */}
      {showModal && activeEmployee && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-950 rounded-3xl p-6 shadow-2xl relative border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-900 mb-5">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                <span>
                  Livre de Paie de {activeEmployee.prenom} {activeEmployee.nom} ({getMonthName(selectedMonth)} {selectedYear})
                </span>
              </h3>
              <button
                id="btn-close-payroll-modal"
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-5 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl flex items-center justify-between">
              <span>Poste : <strong>{activeEmployee.poste}</strong> • Matricule : <strong>{activeEmployee.matricule}</strong></span>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300 text-[10px] px-2.5 py-0.5 rounded-md font-bold uppercase">{activeEmployee.service}</span>
            </p>

            <form id="bulk-payroll-form" onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contractual Details */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-3">
                  <h4 className="font-extrabold text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Rémunération de Base</h4>
                  
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Salaire de base contractuel ({settings.devise})
                    </label>
                    <input
                      id="manager-form-base"
                      type="number"
                      required
                      value={salaireBase}
                      onChange={(e) => setSalaireBase(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Sursalaire ({settings.devise})
                    </label>
                    <input
                      id="manager-form-sursalaire"
                      type="number"
                      value={sursalaire}
                      onChange={(e) => setSursalaire(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Jours travaillés (Référence 30)
                    </label>
                    <input
                      id="manager-form-jours-travailles"
                      type="number"
                      required
                      value={joursTravailles}
                      onChange={(e) => setJoursTravailles(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>

                {/* Primes & Accessoires */}
                <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-3">
                  <h4 className="font-extrabold text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Primes & Indemnités</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Ancienneté</label>
                      <input
                        id="manager-form-prime-anciennete"
                        type="number"
                        value={primeAnciennete}
                        onChange={(e) => setPrimeAnciennete(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Responsabilité</label>
                      <input
                        id="manager-form-prime-responsabilite"
                        type="number"
                        value={primeResponsabilite}
                        onChange={(e) => setPrimeResponsabilite(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Logement</label>
                      <input
                        id="manager-form-indemnite-logement"
                        type="number"
                        value={indemniteLogement}
                        onChange={(e) => setIndemniteLogement(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Commission</label>
                      <input
                        id="manager-form-commission"
                        type="number"
                        value={commission}
                        onChange={(e) => setCommission(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Transport Impo.</label>
                      <input
                        id="manager-form-transport-imposable"
                        type="number"
                        value={transportImposable}
                        onChange={(e) => setTransportImposable(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Transport Non Imp.</label>
                      <input
                        id="manager-form-transport-non-imposable"
                        type="number"
                        value={transportNonImposable}
                        onChange={(e) => setTransportNonImposable(Number(e.target.value))}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions & Impots */}
              <div className="bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800/80 space-y-3">
                <h4 className="font-extrabold text-[10px] text-zinc-400 uppercase tracking-wider mb-2">Retenues, Charges & Impôts</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Retraite C.N.P.S ({settings.taux_cnps}%)
                    </label>
                    <input
                      id="manager-form-cnps"
                      type="number"
                      value={cotisations}
                      onChange={(e) => setCotisations(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Impôt I.T.S ({settings.taux_impot}%)
                    </label>
                    <input
                      id="manager-form-its"
                      type="number"
                      value={impotMontant}
                      onChange={(e) => setImpotMontant(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                      Retenues diverses
                    </label>
                    <input
                      id="manager-form-retenues-diverses"
                      type="number"
                      value={retenuesDiverses}
                      onChange={(e) => setRetenuesDiverses(Number(e.target.value))}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic live calculation preview of Net Pay */}
              <div className="bg-blue-600/10 dark:bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-blue-700 dark:text-blue-300">Salaire Net Calculé Automatiquement :</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Calculé en temps réel selon les règles comptables West-Africaines.</p>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black text-blue-700 dark:text-blue-400">
                    {formatCurrency(salaireNet, settings.devise)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  Observation
                </label>
                <textarea
                  id="manager-form-observation"
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Saisissez des remarques de paie ou justifications d'ajustement..."
                  rows={2}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                ></textarea>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-end gap-3">
                <button
                  id="btn-cancel-payroll-modal"
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                >
                  Annuler
                </button>
                <button
                  id="btn-submit-payroll-modal"
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/15"
                >
                  Valider et Enregistrer 🧾
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-150 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                    Importer un fichier de paie Excel (.xlsx)
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Importation automatisée avec détection intelligente des colonnes et collaborateurs
                  </p>
                </div>
              </div>
              <button
                id="btn-close-import-modal"
                onClick={() => {
                  setShowImportModal(false);
                  setMatchedData([]);
                  setColumnsMapped([]);
                  setImportError(null);
                }}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-xl text-zinc-400 hover:text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Period configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Mois de destination
                  </label>
                  <select
                    id="import-select-month"
                    value={importMonth}
                    onChange={(e) => {
                      const m = Number(e.target.value);
                      setImportMonth(m);
                    }}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        {getMonthName(m)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                    Année de destination
                  </label>
                  <select
                    id="import-select-year"
                    value={importYear}
                    onChange={(e) => {
                      const y = Number(e.target.value);
                      setImportYear(y);
                    }}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs font-semibold"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Excel template download notice */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-800/40 p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mt-0.5">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-zinc-900 dark:text-white">
                      Télécharger un modèle de structure Excel conforme
                    </h4>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Contient tous les 63 éléments du livre de paie et les informations collaborateurs pour garantir un import à 100% sans erreur.
                    </p>
                  </div>
                </div>
                <button
                  id="btn-download-import-template"
                  type="button"
                  onClick={downloadTemplateExcel}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-[11px] transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Modèle de Paie .xlsx</span>
                </button>
              </div>

              {/* Drag and drop zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    processExcelFile(file, importMonth, importYear);
                  }
                }}
                className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                  isDragging
                    ? 'border-blue-500 bg-blue-500/5'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/10 hover:bg-zinc-50 dark:hover:bg-zinc-900/20'
                }`}
              >
                <div className="p-4 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-200/50 dark:border-zinc-800 rounded-2xl text-blue-600 mb-4">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white mb-1">
                  Glissez-déposez votre fichier Excel ici
                </h4>
                <p className="text-[11px] text-zinc-500 max-w-sm mb-4">
                  Prend en charge les formats standard d'exportation .xlsx ou .xls contenant le matricule, le nom, le salaire de base, les primes et charges sociales.
                </p>
                <label className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer shadow-md shadow-blue-500/10 transition-all">
                  Parcourir les fichiers
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        processExcelFile(file, importMonth, importYear);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Error Alert */}
              {importError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <h5 className="font-bold text-xs">Une erreur est survenue</h5>
                    <p className="text-[11px] mt-0.5">{importError}</p>
                  </div>
                </div>
              )}

              {/* Mapped columns preview */}
              {columnsMapped.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Colonnes détectées et mappées ({columnsMapped.length}) :
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-zinc-150 dark:border-zinc-800/80 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10">
                    {columnsMapped.map((col, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-lg text-[10px] text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5"
                      >
                        <span className="font-semibold text-zinc-400">"{col.header}"</span>
                        <span className="text-zinc-400">→</span>
                        <span className="text-blue-600 dark:text-blue-400 font-bold">{col.matchedLabel}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extracted Rows Preview */}
              {matchedData.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                      Lignes à importer ({matchedData.length})
                    </span>
                    <div className="flex items-center gap-4 text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                        <span className="text-zinc-600 dark:text-zinc-400 font-semibold">
                          {matchedData.filter(m => m.isNewEmployee).length} nouveaux collaborateurs
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 bg-zinc-400 rounded-full"></span>
                        <span className="text-zinc-600 dark:text-zinc-400 font-semibold">
                          {matchedData.filter(m => !m.isNewEmployee).length} existants
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-500 dark:text-zinc-400 font-bold">
                            <th className="px-4 py-3">Matricule</th>
                            <th className="px-4 py-3">Collaborateur</th>
                            <th className="px-4 py-3">Statut</th>
                            <th className="px-4 py-3 text-right">Salaire de Base</th>
                            <th className="px-4 py-3 text-right">Salaire Net Mappé</th>
                            <th className="px-4 py-3 text-center">Champs Trouvés</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 dark:divide-zinc-800 text-[11px] text-zinc-700 dark:text-zinc-300">
                          {matchedData.map((item, index) => (
                            <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                              <td className="px-4 py-2.5 font-mono text-[10px]">
                                {item.matriculeText}
                              </td>
                              <td className="px-4 py-2.5 font-semibold">
                                {item.nomPrenomsText}
                              </td>
                              <td className="px-4 py-2.5">
                                {item.isNewEmployee ? (
                                  <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full text-[9px] font-bold">
                                    Nouveau
                                  </span>
                                ) : (
                                  <span className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded-full text-[9px] font-semibold">
                                    Existant
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-2.5 text-right font-mono text-[10px]">
                                {formatCurrency(item.recordCandidate.salaire_base || 0, settings.devise)}
                              </td>
                              <td className="px-4 py-2.5 text-right font-bold font-mono text-[10px] text-zinc-900 dark:text-white">
                                {formatCurrency(item.recordCandidate.salaire_net || 0, settings.devise)}
                              </td>
                              <td className="px-4 py-2.5 text-center font-mono text-[10px] text-zinc-400">
                                {item.fieldsCount} éléments
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-zinc-150 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-end gap-3 shrink-0">
              <button
                id="btn-cancel-import-action"
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setMatchedData([]);
                  setColumnsMapped([]);
                  setImportError(null);
                }}
                className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-import-action"
                type="button"
                disabled={matchedData.length === 0}
                onClick={handleConfirmImport}
                className={`px-5 py-2 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 ${
                  matchedData.length === 0
                    ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/10'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Importer {matchedData.length > 0 ? `${matchedData.length} fiches` : ''} ⚡</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline X component to avoid import issues
function X({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
