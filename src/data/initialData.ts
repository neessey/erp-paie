import { Employee, MonthlyRecord, AppSettings, ActivityLog } from '../types';
import { calculateMonthlyNet } from '../utils/calculations';

export const INITIAL_SETTINGS: AppSettings = {
  nom_entreprise: 'Innovatech Solutions',
  logo: '',
  adresse: 'Boulevard Latrille, Abidjan, Côte d\'Ivoire',
  devise: 'FCFA',
  taux_tva: 18,      // % on sales (for reference)
  taux_cnps: 5.5,    // % on base salary
  taux_impot: 10,    // % on brut
  taux_retenues: 4,  // % on brut (other payroll taxes)
  taux_assurances: 2, // % on base salary
};

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    matricule: 'EMP-2024-001',
    nom: 'Kouassi',
    prenom: 'Jean',
    sexe: 'M',
    date_naissance: '1988-04-12',
    telephone: '+225 07 48 12 34 56',
    email: 'j.kouassi@innovatech.ci',
    service: 'Ventes',
    poste: 'Directeur Commercial',
    responsable: 'Aminata Touré',
    date_embauche: '2024-01-15',
    salaire_base: 600000,
    statut: 'Actif',
  },
];

// Generate initial historical records for May and June 2026.
const createRecord = (
  id: string,
  empId: string,
  mois: number,
  annee: number,
  base: number,
  prime: number,
  bonus: number,
  ca: number,
  ventes: number,
  obj: number,
  obs: string
): MonthlyRecord => {
  const { cotisations, impot_montant, taxes_montant, salaire_net } = calculateMonthlyNet({
    salaire_base: base,
    prime,
    bonus,
    taux_cnps: INITIAL_SETTINGS.taux_cnps,
    taux_impot: INITIAL_SETTINGS.taux_impot,
    taux_retenues: INITIAL_SETTINGS.taux_retenues,
    taux_assurances: INITIAL_SETTINGS.taux_assurances,
  });

  return {
    id,
    employe_id: empId,
    mois,
    annee,
    salaire_base: base,
    prime,
    bonus,
    chiffre_affaires: ca,
    ventes_count: ventes,
    ventes_objectif: obj,
    taux_tva: INITIAL_SETTINGS.taux_tva,
    taux_cnps: INITIAL_SETTINGS.taux_cnps,
    taux_impot: INITIAL_SETTINGS.taux_impot,
    taux_retenues: INITIAL_SETTINGS.taux_retenues,
    taux_assurances: INITIAL_SETTINGS.taux_assurances,
    cotisations,
    impot_montant,
    taxes_montant,
    salaire_net,
    observation: obs,
  };
};

export const INITIAL_RECORDS: MonthlyRecord[] = [
  // --- May 2026 ---
  createRecord('rec-m-1', 'emp-1', 5, 2026, 600000, 80000, 20000, 4500000, 15, 12, 'Excellente gestion commerciale en mai.'),
  createRecord('rec-m-2', 'emp-2', 5, 2026, 850000, 0, 40000, 0, 0, 0, 'Bonus pour la livraison à temps de l\'ERP.'),
  createRecord('rec-m-3', 'emp-3', 5, 2026, 350000, 40000, 10000, 2200000, 8, 10, 'A dépassé ses objectifs de prospection.'),
  createRecord('rec-m-4', 'emp-4', 5, 2026, 550000, 0, 0, 0, 0, 0, 'Saisie de la paie sans incident.'),
  createRecord('rec-m-5', 'emp-5', 5, 2026, 500000, 20000, 0, 0, 0, 0, 'Clôture comptable rapide.'),
  createRecord('rec-m-6', 'emp-6', 5, 2026, 1200000, 150000, 50000, 0, 0, 0, 'Supervision des investissements trimestriels.'),

  // --- June 2026 ---
  createRecord('rec-j-1', 'emp-1', 6, 2026, 600000, 95000, 35000, 5200000, 18, 15, 'Objectif dépassé (+15% de CA).'),
  createRecord('rec-j-2', 'emp-2', 6, 2026, 850000, 0, 20000, 0, 0, 0, 'Maintenance préventive des serveurs.'),
  createRecord('rec-j-3', 'emp-3', 6, 2026, 350000, 60000, 20000, 3300000, 11, 10, 'Excellente progression des ventes (+50% de CA).'),
  createRecord('rec-j-4', 'emp-4', 6, 2026, 550000, 0, 0, 0, 0, 0, 'Recrutement réussi de deux profils IT.'),
  createRecord('rec-j-5', 'emp-5', 6, 2026, 500000, 25000, 0, 0, 0, 0, 'Audit de paie interne de routine.'),
  createRecord('rec-j-6', 'emp-6', 6, 2026, 1200000, 150000, 50000, 0, 0, 0, 'Représentation commerciale internationale.'),
];

export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    utilisateur: 'Koffi Yao',
    role: 'Comptable',
    action: 'Initialisation de la base de données',
    details: 'Base de données des employés importée à partir d\'Excel.',
    date: '2026-05-01T08:30:00Z',
  },
  {
    id: 'log-2',
    utilisateur: 'Alice Dubois',
    role: 'RH',
    action: 'Ajout de fiche employé',
    details: 'Création du profil de l\'employé Ibrahim Diallo (Commercial Junior).',
    date: '2026-05-10T11:15:00Z',
  },
  {
    id: 'log-3',
    utilisateur: 'Koffi Yao',
    role: 'Comptable',
    action: 'Saisie de paie',
    details: 'Validation des fiches de paie pour le mois de Mai 2026.',
    date: '2026-05-31T17:00:00Z',
  },
  {
    id: 'log-4',
    utilisateur: 'Aminata Touré',
    role: 'Directeur',
    action: 'Modification des paramètres de paie',
    details: 'Mise à jour du taux CNPS de 5.0% à 5.5%.',
    date: '2026-06-05T09:45:00Z',
  },
  {
    id: 'log-5',
    utilisateur: 'Alice Dubois',
    role: 'RH',
    action: 'Modification de fiche employé',
    details: 'Mise à jour du salaire de base de Jean Kouassi de 550 000 à 600 000 FCFA.',
    date: '2026-06-10T14:20:00Z',
  },
];
