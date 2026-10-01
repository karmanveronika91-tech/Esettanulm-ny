import React, { useState } from 'react';
import { Employee } from '../types';
import { PannonJobLogo } from './PannonJobLogo';
import { Lock, KeyRound, CheckCircle2, AlertCircle, ShieldAlert, ArrowRight } from 'lucide-react';
import { generateDefaultPassword } from '../utils/authUtils';

interface PasswordChangeModalProps {
  employee: Employee;
  onSavePassword: (employeeId: string, newPassword: string) => void;
  onCancel?: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  employee,
  onSavePassword,
  onCancel,
}) => {
  const defaultPass = employee.defaultPassword || generateDefaultPassword(employee.name);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmed = newPassword.trim();
    if (trimmed.length < 6) {
      setError('Az új jelszónak legalább 6 karakter hosszúnak kell lennie!');
      return;
    }

    if (trimmed === defaultPass) {
      setError(`Az új jelszó nem lehet az eredeti alapértelmezett jelszó (${defaultPass})! Kérjük, adj meg egy új, egyedi jelszót.`);
      return;
    }

    if (trimmed !== confirmPassword.trim()) {
      setError('A megadott két jelszó nem egyezik meg!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      onSavePassword(employee.id, trimmed);
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                Kötelező Kezdeti Jelszócsere
              </h2>
              <p className="text-xs text-slate-400">Munkatársi Fiók Védelem</p>
            </div>
          </div>
          <PannonJobLogo variant="light" size="sm" />
        </div>

        {/* Info Card */}
        <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-2xl text-xs space-y-2">
          <div className="flex items-center space-x-2 text-amber-300 font-bold">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>Kedves {employee.name}!</span>
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            A fiókodhoz egy automatikusan generált ideiglenes jelszó volt érvényben (<strong>{defaultPass}</strong>).
            A rendszer biztonsági szabályzata szerint az első belépés alkalmával kötelező megadnod a saját, egyedi jelszavadat.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-red-200 text-xs font-semibold flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Új Saját Jelszó * <span className="text-[11px] text-slate-500">(legalább 6 karakter)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Új jelszó megadása"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[10px] text-slate-400 hover:text-white"
              >
                {showPassword ? 'Elrejt' : 'Mutat'}
              </button>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-300 mb-1.5">
              Új Jelszó Megerősítése *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Új jelszó újra"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all cursor-pointer text-xs"
                >
                  Mégsem / Kijelentkezés
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Mentés folyamatban...' : 'Új Jelszó Mentése & Belépés'}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
