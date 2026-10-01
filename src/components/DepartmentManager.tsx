import React, { useState } from 'react';
import { Employee, Submission, CaseAssignment } from '../types';
import { DEFAULT_DEPARTMENTS } from '../data/pannonjobDepartments';
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  RotateCcw,
  Users,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface DepartmentManagerProps {
  departments: string[];
  employees?: Employee[];
  submissions?: Submission[];
  assignments?: CaseAssignment[];
  onSaveDepartments: (newDepartments: string[]) => void;
  onRenameDepartment?: (oldName: string, newName: string) => void;
  onGoBack?: () => void;
}

export const DepartmentManager: React.FC<DepartmentManagerProps> = ({
  departments,
  employees = [],
  submissions = [],
  assignments = [],
  onSaveDepartments,
  onRenameDepartment,
  onGoBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deletingDept, setDeletingDept] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Filtered departments
  const filteredDepartments = departments.filter((d) =>
    d.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  // Statistics helper per department
  const getDeptStats = (deptName: string) => {
    const trimmed = deptName.trim().toLowerCase();
    const empCount = employees.filter((e) => e.department?.trim().toLowerCase() === trimmed).length;
    const subCount = submissions.filter((s) => s.department?.trim().toLowerCase() === trimmed).length;
    return { empCount, subCount };
  };

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = newDeptName.trim();
    if (!name) {
      setErrorMessage('Kérjük, add meg a részleg nevét!');
      return;
    }

    if (departments.some((d) => d.trim().toLowerCase() === name.toLowerCase())) {
      setErrorMessage(`A(z) "${name}" részleg már szerepel a listában!`);
      return;
    }

    const updated = [...departments, name];
    onSaveDepartments(updated);
    setNewDeptName('');
    setSuccessMessage(`A(z) "${name}" részleg sikeresen hozzáadva.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const startEditing = (idx: number, currentName: string) => {
    setEditingIndex(idx);
    setEditingValue(currentName);
    setErrorMessage(null);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const saveEditing = (originalName: string) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const updatedName = editingValue.trim();

    if (!updatedName) {
      setErrorMessage('A részleg neve nem lehet üres!');
      return;
    }

    if (
      updatedName.toLowerCase() !== originalName.toLowerCase() &&
      departments.some((d) => d.trim().toLowerCase() === updatedName.toLowerCase())
    ) {
      setErrorMessage(`A(z) "${updatedName}" részleg már létezik!`);
      return;
    }

    const updatedList = departments.map((d) => (d === originalName ? updatedName : d));
    onSaveDepartments(updatedList);

    if (onRenameDepartment && originalName !== updatedName) {
      onRenameDepartment(originalName, updatedName);
    }

    setEditingIndex(null);
    setEditingValue('');
    setSuccessMessage(`A(z) "${originalName}" átnevezve: "${updatedName}".`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleDelete = (deptName: string) => {
    const updated = departments.filter((d) => d !== deptName);
    onSaveDepartments(updated);
    setDeletingDept(null);
    setSuccessMessage(`A(z) "${deptName}" részleg törölve.`);
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleResetToDefaults = () => {
    onSaveDepartments([...DEFAULT_DEPARTMENTS]);
    setShowResetConfirm(false);
    setSuccessMessage('Alapértelmezett részlegek sikeresen visszaállítva.');
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0 border border-amber-500/20 shadow-xs">
              <Building2 className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Részlegek & Osztályok Kezelése
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Szervezeti egységek bővítése, átnevezése vagy eltávolítása a minőségbiztosítási rendszerben
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              title="Visszaállítás az eredeti gyári listára"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Alapértelmezettek</span>
            </button>
            {onGoBack && (
              <button
                type="button"
                onClick={onGoBack}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Vissza
              </button>
            )}
          </div>
        </div>

        {/* Info alerts */}
        {errorMessage && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-900 flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-950 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Quick Add Form */}
        <form onSubmit={handleAddDepartment} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/90 space-y-3">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
            ➕ Új Részleg vagy Osztály Hozzáadása
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="pl. Szolgáltatásmarketing, Munkaügy Szeged, Logisztika..."
                className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Hozzáadás a Listához</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 block">
            A hozzáadott részleg azonnal megjelenik az esettanulmány beküldéseknél és a munkatársi adatlapon.
          </span>
        </form>

        {/* Summary Counter & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-600">
            <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-slate-800">
              Összesen: <strong>{departments.length}</strong> részleg
            </span>
            {searchQuery && (
              <span className="text-slate-500 font-medium">
                (Találatok: {filteredDepartments.length})
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Részleg keresése..."
              className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium"
            />
          </div>
        </div>
      </div>

      {/* Departments Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredDepartments.map((dept, index) => {
          const isEditing = editingIndex === index;
          const { empCount, subCount } = getDeptStats(dept);

          return (
            <div
              key={index}
              className={`p-4 rounded-2xl border transition-all ${
                isEditing
                  ? 'bg-amber-50/70 border-amber-300 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {isEditing ? (
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                    Részleg átnevezése:
                  </span>
                  <input
                    type="text"
                    autoFocus
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditing(dept);
                      if (e.key === 'Escape') cancelEditing();
                    }}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  />
                  <div className="flex items-center justify-end space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Mégse
                    </button>
                    <button
                      type="button"
                      onClick={() => saveEditing(dept)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center space-x-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mentés</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 font-black text-xs flex items-center justify-center flex-shrink-0 border border-slate-200">
                        {index + 1}
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 truncate" title={dept}>
                        {dept}
                      </h3>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px] text-slate-500">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                        <Users className="w-3 h-3 text-slate-500" />
                        <span>{empCount} munkatárs</span>
                      </span>
                      {subCount > 0 && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                          <FileCheck className="w-3 h-3 text-emerald-600" />
                          <span>{subCount} beküldés</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(index, dept)}
                      title="Részleg nevének szerkesztése"
                      className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingDept(dept)}
                      title="Részleg törlése a listából"
                      className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center space-y-3">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-700">Nem található részleg a keresési feltételre</h4>
          <p className="text-xs text-slate-400">Próbálj meg más kifejezésre keresni, vagy add hozzá új részlegként felül!</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingDept && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Részleg törlésének megerősítése</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Biztosan törölni szeretnéd a(z) <strong className="text-slate-900">"{deletingDept}"</strong> részleget a választható osztályok listájából?
              </p>
              {getDeptStats(deletingDept).empCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 text-xs font-semibold text-left mt-2">
                  ⚠️ Figyelem: Jelenleg <strong>{getDeptStats(deletingDept).empCount} munkatárs</strong> ehhez a részleghez van rendelve.
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDept(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deletingDept)}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm"
              >
                Igen, törlés
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Alapértelmezett részlegek visszaállítása</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ez a művelet visszaállítja az összes eredeti cégcsoportos részleget ({DEFAULT_DEPARTMENTS.length} db). Biztosan folytatod?
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
              >
                Mégse
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold cursor-pointer transition-colors shadow-sm"
              >
                Visszaállítás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
