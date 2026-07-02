import { MonthlyRecord, Employee } from '../types';

export function calculateMonthlyNet({
  salaire_base,
  prime,
  bonus,
  taux_cnps,
  taux_impot,
  taux_retenues,
  taux_assurances,
}: {
  salaire_base: number;
  prime: number;
  bonus: number;
  taux_cnps: number;
  taux_impot: number;
  taux_retenues: number;
  taux_assurances: number;
}) {
  const brut = salaire_base + prime + bonus;
  const cotisations = Math.round(salaire_base * (taux_cnps / 100) + salaire_base * (taux_assurances / 100));
  const impot_montant = Math.round(brut * (taux_impot / 100));
  const taxes_montant = Math.round(brut * (taux_retenues / 100));
  const salaire_net = Math.max(0, brut - cotisations - impot_montant - taxes_montant);

  return {
    brut,
    cotisations,
    impot_montant,
    taxes_montant,
    salaire_net,
  };
}

export function getPreviousMonth(mois: number, annee: number): { mois: number; annee: number } {
  if (mois === 1) {
    return { mois: 12, annee: annee - 1 };
  }
  return { mois: mois - 1, annee };
}

export function getComparisonStats(
  employeeId: string,
  currentMois: number,
  currentAnnee: number,
  allRecords: MonthlyRecord[]
) {
  const currentRecord = allRecords.find(
    (r) => r.employe_id === employeeId && r.mois === currentMois && r.annee === currentAnnee
  );

  const prev = getPreviousMonth(currentMois, currentAnnee);
  const prevRecord = allRecords.find(
    (r) => r.employe_id === employeeId && r.mois === prev.mois && r.annee === prev.annee
  );

  if (!currentRecord) {
    return null;
  }

  const getPercentChange = (curr: number, prevVal: number) => {
    if (prevVal === undefined || prevVal === null || prevVal === 0) {
      return curr > 0 ? 100 : 0;
    }
    return Math.round(((curr - prevVal) / prevVal) * 100);
  };

  const caChange = prevRecord ? getPercentChange(currentRecord.chiffre_affaires, prevRecord.chiffre_affaires) : 0;
  const salaireChange = prevRecord ? getPercentChange(currentRecord.salaire_base, prevRecord.salaire_base) : 0;
  const primeChange = prevRecord ? getPercentChange(currentRecord.prime + currentRecord.bonus, prevRecord.prime + prevRecord.bonus) : 0;
  const netSalaryChange = prevRecord ? getPercentChange(currentRecord.salaire_net, prevRecord.salaire_net) : 0;

  return {
    currentRecord,
    prevRecord,
    caChange,
    salaireChange,
    primeChange,
    netSalaryChange,
    hasPrev: !!prevRecord,
  };
}

export function formatCurrency(value: number, currency: string = 'FCFA'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value) + ' ' + currency;
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ];
  return months[monthNumber - 1] || '';
}
