import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  ChevronRight,
  ShieldAlert,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Employee, Role, EmployeeStatus } from '../types';
import { formatCurrency } from '../utils/calculations';

interface EmployeeListProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  onSelectEmployee: (employee: Employee) => void;
  onAddLog: (action: string, details: string, prev?: string, next?: string) => void;
  devise: string;
}

export default function EmployeeList({
  employees,
  setEmployees,
  onSelectEmployee,
  onAddLog,
  devise,
}: EmployeeListProps) {
  const [search, setSearch] = useState('');
  const [serviceFilter, setServiceFilter] = useState('Tous');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [sortBy, setSortBy] = useState<'nom' | 'salaire' | 'embauche'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form states for Add/Edit
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form Fields
  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [sexe, setSexe] = useState<'M' | 'F'>('M');
  const [dateNaissance, setDateNaissance] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [service, setService] = useState('Ventes');
  const [poste, setPoste] = useState('');
  const [responsable, setResponsable] = useState('');
  const [dateEmbauche, setDateEmbauche] = useState('');
  const [salaireBase, setSalaireBase] = useState(400000);
  const [statut, setStatut] = useState<EmployeeStatus>('Actif');

  // Permission Check
  const canModify = true;

  const services = useMemo(() => {
    const list = new Set(employees.map((e) => e.service));
    return ['Tous', ...Array.from(list)];
  }, [employees]);

  // Handle open form for create
  const handleOpenCreate = () => {
    if (!canModify) return;
    setEditingEmployee(null);
    // Auto-generate random matricule
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setMatricule(`EMP-${year}-${randNum}`);
    setNom('');
    setPrenom('');
    setSexe('M');
    setDateNaissance('1990-01-01');
    setTelephone('');
    setEmail('');
    setService('Ventes');
    setPoste('');
    setResponsable('');
    setDateEmbauche(new Date().toISOString().split('T')[0]);
    setSalaireBase(400000);
    setStatut('Actif');
    setShowForm(true);
  };

  // Handle open form for edit
  const handleOpenEdit = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid triggering details row selection
    if (!canModify) return;
    setEditingEmployee(emp);
    setMatricule(emp.matricule);
    setNom(emp.nom);
    setPrenom(emp.prenom);
    setSexe(emp.sexe);
    setDateNaissance(emp.date_naissance);
    setTelephone(emp.telephone);
    setEmail(emp.email);
    setService(emp.service);
    setPoste(emp.poste);
    setResponsable(emp.responsable);
    setDateEmbauche(emp.date_embauche);
    setSalaireBase(emp.salaire_base);
    setStatut(emp.statut);
    setShowForm(true);
  };

  // Submit Employee Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canModify) return;

    if (editingEmployee) {
      // Edit existing
      const oldVal = JSON.stringify(editingEmployee);
      const updated: Employee = {
        ...editingEmployee,
        matricule,
        nom,
        prenom,
        sexe,
        date_naissance: dateNaissance,
        telephone,
        email,
        service,
        poste,
        responsable,
        date_embauche: dateEmbauche,
        salaire_base: Number(salaireBase),
        statut,
      };

      setEmployees((prev) => prev.map((item) => (item.id === editingEmployee.id ? updated : item)));
      onAddLog(
        'Modification de fiche employé',
        `Mise à jour du profil de ${prenom} ${nom} (Matricule: ${matricule})`,
        oldVal,
        JSON.stringify(updated)
      );
    } else {
      // Create new
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        matricule,
        nom,
        prenom,
        sexe,
        date_naissance: dateNaissance,
        telephone,
        email,
        service,
        poste,
        responsable,
        date_embauche: dateEmbauche,
        salaire_base: Number(salaireBase),
        statut,
      };

      setEmployees((prev) => [...prev, newEmp]);
      onAddLog(
        'Ajout de fiche employé',
        `Création de la fiche employé pour ${prenom} ${nom} (${poste})`,
        undefined,
        JSON.stringify(newEmp)
      );
    }

    setShowForm(false);
  };

  // Delete Employee
  const handleDelete = (emp: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canModify) return;

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la fiche de ${emp.prenom} ${emp.nom} ? Cette action supprimera également son historique.`)) {
      setEmployees((prev) => prev.filter((item) => item.id !== emp.id));
      onAddLog(
        'Suppression d\'employé',
        `Retrait définitif de l'employé ${emp.prenom} ${emp.nom} du système.`,
        JSON.stringify(emp),
        undefined
      );
    }
  };

  // Toggle sorting
  const triggerSort = (field: 'nom' | 'salaire' | 'embauche') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Filter & Sort Logic
  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const matchesSearch =
          `${emp.prenom} ${emp.nom}`.toLowerCase().includes(search.toLowerCase()) ||
          emp.matricule.toLowerCase().includes(search.toLowerCase()) ||
          emp.poste.toLowerCase().includes(search.toLowerCase());

        const matchesService = serviceFilter === 'Tous' || emp.service === serviceFilter;
        const matchesStatus = statusFilter === 'Tous' || emp.statut === statusFilter;

        return matchesSearch && matchesService && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = '';
        let valB: any = '';

        if (sortBy === 'nom') {
          valA = `${a.nom} ${a.prenom}`.toLowerCase();
          valB = `${b.nom} ${b.prenom}`.toLowerCase();
        } else if (sortBy === 'salaire') {
          valA = a.salaire_base;
          valB = b.salaire_base;
        } else if (sortBy === 'embauche') {
          valA = new Date(a.date_embauche).getTime();
          valB = new Date(b.date_embauche).getTime();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [employees, search, serviceFilter, statusFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Header section with add button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Répertoire des Employés
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Gérez vos effectifs, mettez à jour les postes et fixez les salaires de base.
          </p>
        </div>

        <button
          id="btn-add-employee"
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition-colors text-sm w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          <span>Enregistrer un Employé</span>
        </button>
      </div>

      {/* Interactive Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            id="employee-search-input"
            type="text"
            placeholder="Rechercher par nom, matricule ou poste..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-900 text-zinc-800 dark:text-zinc-200"
          />
        </div>

        {/* Service filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
          <select
            id="filter-service-select"
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="w-full md:w-40 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
          >
            {services.map((serv) => (
              <option key={serv} value={serv}>
                {serv === 'Tous' ? 'Tous les services' : serv}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <select
          id="filter-status-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-36 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl py-2 px-3 focus:outline-none focus:ring-1 focus:ring-blue-500 text-zinc-800 dark:text-zinc-200"
        >
          <option value="Tous">Tous statuts</option>
          <option value="Actif">Actifs</option>
          <option value="Inactif">Inactifs</option>
        </select>
      </div>

      {/* Grid of employees */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <div
            id={`employee-card-${emp.id}`}
            key={emp.id}
            onClick={() => onSelectEmployee(emp)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
          >
            {/* Background design */}
            <div className="absolute right-0 top-0 w-20 h-20 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-125 transition-transform"></div>

            {/* Top row: Profile & basic info */}
            <div>
              <div className="flex items-start gap-4">
                <div className="space-y-1 overflow-hidden">
                  <span className="text-[9px] font-mono font-bold tracking-wider uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-500 px-2 py-0.5 rounded-md">
                    {emp.matricule}
                  </span>
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                    {emp.prenom} {emp.nom}
                  </h3>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{emp.poste}</span>
                  </p>
                </div>
              </div>

              {/* Technical details list */}
              <div className="mt-5 space-y-2.5 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span className="truncate">{emp.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>{emp.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span>Embauché le {new Date(emp.date_embauche).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>
            </div>

            {/* Bottom Row with Salary, Status, Actions */}
            <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-wide">Base de rémunération</p>
                <p className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  {formatCurrency(emp.salaire_base, devise)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    emp.statut === 'Actif'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {emp.statut}
                </span>

                {canModify && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`edit-employee-btn-${emp.id}`}
                      onClick={(e) => handleOpenEdit(emp, e)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      id={`delete-employee-btn-${emp.id}`}
                      onClick={(e) => handleDelete(emp, e)}
                      className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full bg-zinc-50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-12 text-center text-zinc-500 dark:text-zinc-400">
            <ShieldAlert className="w-10 h-10 mx-auto text-zinc-400 dark:text-zinc-600 mb-4" />
            <p className="font-medium text-sm">Aucun employé ne correspond à vos filtres.</p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
              Essayez d'ajuster vos termes de recherche ou de changer de service.
            </p>
          </div>
        )}
      </div>

      {/* Register/Edit Slide-over Drawer Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-950 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span>{editingEmployee ? 'Modifier l\'Employé' : 'Enregistrer un nouvel Employé'}</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                    {editingEmployee ? `Mise à jour : ${matricule}` : 'Saisissez les informations de base pour le contrat.'}
                  </p>
                </div>
                <button
                  id="btn-close-employee-form"
                  onClick={() => setShowForm(false)}
                  className="p-1.5 bg-zinc-50 dark:bg-zinc-900 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body */}
              <form id="employee-profile-form" onSubmit={handleSubmit} className="mt-6 space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Matricule (Généré)
                    </label>
                    <input
                      id="form-matricule"
                      type="text"
                      disabled
                      value={matricule}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-500 font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Sexe
                    </label>
                    <div className="flex items-center gap-4 mt-1.5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        <input
                          id="form-sexe-m"
                          type="radio"
                          name="sexe"
                          checked={sexe === 'M'}
                          onChange={() => setSexe('M')}
                          className="accent-blue-600"
                        />
                        <span>Homme</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        <input
                          id="form-sexe-f"
                          type="radio"
                          name="sexe"
                          checked={sexe === 'F'}
                          onChange={() => setSexe('F')}
                          className="accent-blue-600"
                        />
                        <span>Femme</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-prenom"
                      type="text"
                      required
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      placeholder="Jean"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Nom de famille <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-nom"
                      type="text"
                      required
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      placeholder="Kouassi"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Email professionnel <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="j.kouassi@innovatech.ci"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Téléphone mobile <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-telephone"
                      type="text"
                      required
                      value={telephone}
                      onChange={(e) => setTelephone(e.target.value)}
                      placeholder="+225 07..."
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Date de Naissance
                    </label>
                    <input
                      id="form-date-naissance"
                      type="date"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Date d'embauche
                    </label>
                    <input
                      id="form-date-embauche"
                      type="date"
                      value={dateEmbauche}
                      onChange={(e) => setDateEmbauche(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Département / Service
                    </label>
                    <select
                      id="form-service"
                      value={service}
                      onChange={(e) => setService(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Ventes">Ventes</option>
                      <option value="IT">IT</option>
                      <option value="Ressources Humaines">Ressources Humaines</option>
                      <option value="Finance">Finance</option>
                      <option value="Direction">Direction</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Poste de travail <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-poste"
                      type="text"
                      required
                      value={poste}
                      onChange={(e) => setPoste(e.target.value)}
                      placeholder="Chef de projet IT"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Salaire de base ({devise}) <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="form-salaire-base"
                      type="number"
                      required
                      min={0}
                      value={salaireBase}
                      onChange={(e) => setSalaireBase(Number(e.target.value))}
                      placeholder="500000"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Manager / Responsable
                    </label>
                    <input
                      id="form-responsable"
                      type="text"
                      value={responsable}
                      onChange={(e) => setResponsable(e.target.value)}
                      placeholder="Aminata Touré"
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Statut
                    </label>
                    <select
                      id="form-statut"
                      value={statut}
                      onChange={(e) => setStatut(e.target.value as EmployeeStatus)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Actif">Actif</option>
                      <option value="Inactif">Inactif</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-end gap-3 mt-4">
                  <button
                    id="btn-cancel-employee-form"
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Annuler
                  </button>
                  <button
                    id="btn-submit-employee-form"
                    type="submit"
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-blue-500/10"
                  >
                    {editingEmployee ? 'Sauvegarder les modifications' : 'Enregistrer l\'employé'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
