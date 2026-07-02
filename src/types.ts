export type Role = 'Admin' | 'RH' | 'Comptable' | 'Directeur';

export interface User {
  id: string;
  nom: string;
  email: string;
  role: Role;
}

export type EmployeeStatus = 'Actif' | 'Inactif';

export interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  sexe: 'M' | 'F';
  date_naissance: string;
  telephone: string;
  email: string;
  service: string;
  poste: string;
  responsable: string;
  date_embauche: string;
  salaire_base: number;
  statut: EmployeeStatus;
}

export interface MonthlyRecord {
  id: string; // unique identifier for the record
  employe_id: string;
  mois: number; // 1-12
  annee: number;
  observation: string;

  // Exact 63 elements of the payslip / livre de paie (excluding metadata like employee id, month, year)
  jours_travailles?: number;                    // 3. Jours travaillés
  salaire_base: number;                         // 4. Salaire de base
  sursalaire?: number;                          // 5. Sursalaire
  prime_anciennete?: number;                    // 6. Prime d'ancienneté
  regularisation_prime_anciennete?: number;     // 7. Régularisation de prime d'ancienneté
  prime_rendement?: number;                     // 8. Prime de rendement
  heures_sup_15?: number;                       // 9. Heures supplémentaires (15 %)
  heures_sup_50?: number;                       // 10. Heures supplémentaires (50 %)
  heures_sup_75?: number;                       // 11. Heures supplémentaires (75 %)
  heures_sup_100?: number;                      // 12. Heures supplémentaires (100 %)
  prime_responsabilite?: number;                // 13. Prime de responsabilité
  prime_entretien_tenue?: number;               // 14. Prime d'entretien de tenue
  indemnite_logement?: number;                  // 15. Indemnité de logement
  prime_interim?: number;                       // 16. Prime d'intérim
  commission?: number;                          // 17. Commission
  indemnite_conge?: number;                     // 18. Indemnité de congé
  prime_encouragement?: number;                 // 19. Prime d'encouragement
  prime_astreinte?: number;                     // 20. Prime d'astreinte
  gratification?: number;                       // 21. Gratification
  indemnite_licenciement_imposable?: number;    // 22. Indemnité de licenciement imposable
  indemnite_fin_contrat_imposable?: number;      // 23. Indemnité de fin de contrat imposable
  indemnite_preavis?: number;                   // 24. Indemnité de préavis
  prime_transport_imposable?: number;           // 25. Prime de transport imposable
  transport_imposable?: number;                 // Alias/Compatibility for Prime de transport imposable
  salaire_brut_provisoire?: number;             // 26. Salaire brut provisoire (Calculated / custom)
  prime_responsabilite_imposable?: number;      // 27. Prime de responsabilité imposable
  salaire_brut?: number;                        // 28. Salaire brut (Calculated / custom)
  reduction_impot?: number;                     // 29. Réduction d'impôt
  impot_montant: number;                        // 30. Impôt sur les traitements et salaires (ITS)
  cotisations: number;                          // 31. Retraite générale (CNPS)
  prelevement_cmu?: number;                     // 32. Prélèvement CMU
  cotisation_accidents_travail?: number;        // 33. Cotisation accidents du travail
  prestations_familiales?: number;              // 34. Prestations familiales
  taxe_apprentissage?: number;                  // 35. Taxe d'apprentissage
  taxe_formation_continue?: number;             // 36. Taxe de formation professionnelle continue
  remboursement_dette?: number;                 // 37. Remboursement de dette
  retenue_sur_salaire?: number;                 // 38. Retenue sur salaire
  retenue_rav?: number;                         // 39. Retenue RAV
  remboursement_emprunt?: number;               // 40. Remboursement d'emprunt
  retenue_caution?: number;                     // 41. Retenue de caution
  retenues_diverses?: number;                   // 42. Retenues diverses
  retenue_mualean?: number;                     // 43. Retenue MUALEAN
  avance_sur_salaire?: number;                  // 44. Avance sur salaire
  prelevement_portable?: number;                // 45. Prélèvement portable
  pret_divers?: number;                         // 46. Prêt divers
  preavis_du_employeur?: number;                // 47. Préavis dû à l'employeur
  retenue_assurance_salarie?: number;           // 48. Retenue assurance salarié
  prelevement_moto_plan?: number;               // 49. Prélèvement Moto Plan
  dommages_interets_societe?: number;           // 50. Dommages et intérêts dus à la société
  its_patronal?: number;                        // 51. ITS patronal
  prime_transport_non_imposable?: number;       // 52. Prime de transport non imposable
  transport_non_imposable?: number;             // Alias/Compatibility for Prime de transport non imposable
  prime_representation?: number;                // 53. Prime de représentation
  prime_responsabilite_non_imposable?: number;  // 54. Prime de responsabilité non imposable
  indemnite_tenue?: number;                     // 55. Indemnité de tenue
  indemnite_fin_contrat_non_imposable?: number; // 56. Indemnité de fin de contrat non imposable
  indemnite_licenciement_non_imposable?: number;// 57. Indemnité de licenciement non imposable
  indemnite_transactionnelle?: number;          // 58. Indemnité transactionnelle
  remboursement_caution?: number;               // 59. Remboursement de caution
  indemnite_representation_non_imposable?: number; // 60. Indemnité de représentation non imposable
  salaire_net: number;                          // 61. Salaire net (Calculated)
  prelevement_cmu_patronal?: number;            // 62. Prélèvement CMU (part patronale)
  cotisations_cnps_patronales?: number;         // 63. Cotisations CNPS patronales

  // Legacy/Compatibility fields from other views (optional)
  prime?: number;
  bonus?: number;
  chiffre_affaires?: number;
  ventes_count?: number;
  ventes_objectif?: number;
  taux_tva?: number;
  taux_cnps?: number;
  taux_impot?: number;
  taux_retenues?: number;
  taux_assurances?: number;
  taxes_montant?: number;
}

export interface AppSettings {
  nom_entreprise: string;
  logo: string;
  adresse: string;
  devise: string;
  taux_tva: number; // Default VAT / tax rate on individual CA (if applicable)
  taux_cnps: number; // Default CNPS rate on base salary
  taux_impot: number; // Default income tax rate on base salary
  taux_retenues: number; // Default miscellaneous deductions %
  taux_assurances: number; // Default assurance %
}

export interface ActivityLog {
  id: string;
  utilisateur: string;
  role: Role;
  action: string;
  details: string;
  date: string; // ISO String
  ancienne_valeur?: string;
  nouvelle_valeur?: string;
}

export interface Notification {
  id: string;
  type: 'increase' | 'target_reached' | 'record_broken' | 'decrease_alert' | 'missing_alert';
  title: string;
  description: string;
  date: string;
  read: boolean;
  employe_id?: string;
}
