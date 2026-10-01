import React, { useState } from 'react';
import { Employee } from '../types';
import { PannonJobLogo } from './PannonJobLogo';
import { PasswordChangeModal } from './PasswordChangeModal';
import {
  LogIn,
  ShieldCheck,
  UserCheck,
  Briefcase,
  User,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  Info,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import {
  verifyEmployeePassword,
  requiresPasswordChange,
  stripAccents,
} from '../utils/authUtils';

interface LoginViewProps {
  employees: Employee[];
  onLogin?: (employee: Employee) => void;
  onLoginSuccess?: (employee: Employee) => void;
  onUpdateEmployee?: (updated: Employee) => void;
  isModal?: boolean;
  onClose?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  employees,
  onLogin,
  onLoginSuccess,
  onUpdateEmployee,
  isModal = false,
  onClose,
}) => {
  // Credentials
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Forced password change state
  const [pendingEmployeeForPasswordChange, setPendingEmployeeForPasswordChange] = useState<Employee | null>(null);

  const triggerLogin = (emp: Employee) => {
    if (onLoginSuccess) {
      onLoginSuccess(emp);
    } else if (onLogin) {
      onLogin(emp);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const query = usernameOrEmail.trim().toLowerCase();
    const pass = password.trim();

    if (!query) {
      setErrorMessage('Kérjük, add meg a felhasználónevedet vagy a hivatalos e-mail címedet!');
      return;
    }

    if (!pass) {
      setErrorMessage('Kérjük, add meg a jelszavadat!');
      return;
    }

    const queryStripped = stripAccents(query);

    // Find employee by email, username, name, or Karman special identifier
    const found = employees.find((emp) => {
      const email = emp.email.toLowerCase();
      const emailStripped = stripAccents(email);
      const emailPrefix = email.split('@')[0];
      const emailPrefixStripped = stripAccents(emailPrefix);
      const username = (emp.username || emailPrefix).toLowerCase();
      const usernameStripped = stripAccents(username);
      const name = emp.name.toLowerCase();
      const strippedName = stripAccents(name);

      // Support karman.veronika matching both gmail, company emails, or username
      if (
        (queryStripped === 'karman.veronika' ||
          queryStripped === 'karman' ||
          queryStripped === 'karmanveronika' ||
          query.includes('karman.veronika91')) &&
        (emp.id === 'emp-karman-veronika' ||
          usernameStripped === 'karman.veronika' ||
          strippedName.includes('karman'))
      ) {
        return true;
      }

      return (
        email === query ||
        emailStripped === queryStripped ||
        username === query ||
        usernameStripped === queryStripped ||
        emailPrefix === query ||
        emailPrefixStripped === queryStripped ||
        name === query ||
        strippedName === queryStripped
      );
    });

    if (!found) {
      setErrorMessage(
        'Nem található munkatárs ezzel a felhasználónévvel vagy e-mail címmel. Kérjük, ellenőrizd az adatokat!'
      );
      return;
    }

    // Verify password
    const isPasswordValid = verifyEmployeePassword(pass, found);
    if (!isPasswordValid) {
      setErrorMessage(
        'Hibás jelszó! Kérjük, ellenőrizd a megadott jelszavadat!'
      );
      return;
    }

    // Check if password change is required - for karman.veronika this returns false
    if (requiresPasswordChange(found, pass)) {
      setPendingEmployeeForPasswordChange(found);
      return;
    }

    // Successful login - let the user into the portal immediately!
    triggerLogin(found);
  };

  const handleSaveNewPassword = (employeeId: string, newPassword: string) => {
    if (!pendingEmployeeForPasswordChange) return;

    const updatedEmployee: Employee = {
      ...pendingEmployeeForPasswordChange,
      password: newPassword,
      mustChangePassword: false,
      passwordChangedAt: new Date().toISOString(),
    };

    if (onUpdateEmployee) {
      onUpdateEmployee(updatedEmployee);
    }

    setPendingEmployeeForPasswordChange(null);
    triggerLogin(updatedEmployee);
  };

  return (
    <div
      className={
        isModal
          ? 'fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150'
          : 'min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8'
      }
    >
      {/* Forced Password Change Modal */}
      {pendingEmployeeForPasswordChange && (
        <PasswordChangeModal
          employee={pendingEmployeeForPasswordChange}
          onSavePassword={handleSaveNewPassword}
          onCancel={() => setPendingEmployeeForPasswordChange(null)}
        />
      )}

      <div
        className={
          isModal
            ? 'w-full max-w-4xl bg-slate-900/95 border border-slate-700/80 rounded-3xl p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92vh] overflow-y-auto'
            : 'w-full max-w-6xl mx-auto flex-1 flex flex-col justify-between'
        }
      >
        {/* Top Header */}
        <div className="w-full flex items-center justify-between py-2 border-b border-slate-800/80 mb-4">
          <div className="flex items-center space-x-3">
            <PannonJobLogo variant="light" size="md" showSymbolOnly={true} />
            <div className="border-l border-slate-700 pl-3">
              <h1 className="font-extrabold text-sm text-white tracking-tight">
                Esettanulmányok
              </h1>
              <p className="text-[11px] text-slate-400">
                {isModal ? 'Biztonságos Belépés' : 'Minőségbiztosítási Rendszer'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Biztonságos Azonosítás</span>
            </div>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
                title="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Main Login Card */}
        <div className="w-full my-auto py-2 sm:py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* Left Hero & System Info */}
          <div className="lg:col-span-5 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Munkatársi & Vezetői Hitelesítés</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Bejelentkezés felhasználónévvel és jelszóval
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Jelentkezz be fiókoddal! A rendszer a törzsadatokból automatikusan betölti a nevedet, e-mail címedet és szakterületedet.
            </p>

            {/* Security Box */}
            <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-slate-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Biztonságos Rendszerhozzáférés</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                A rendszerhez kizárólag a felhatalmazott munkatársak és vezetők férhetnek hozzá a hivatalos hitelesítő adataikkal.
              </p>
            </div>
          </div>

          {/* Right Login Box */}
          <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 backdrop-blur-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white">Fiók Azonosítás</h3>
                <p className="text-xs text-slate-400">Add meg a felhasználóneved vagy e-mailed, majd jelszavad</p>
              </div>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3.5 bg-red-950/90 border border-red-500/60 rounded-xl text-red-200 text-xs font-semibold flex items-start space-x-2">
                <Info className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1.5">
                  Felhasználónév vagy Hivatalos E-mail Cím *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="felhasználónév vagy e-mail cím"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-3 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-300">Jelszó *</label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-10 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:border-transparent text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black text-sm transition-all shadow-lg cursor-pointer flex items-center justify-center space-x-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Bejelentkezés a Portálra</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
            </form>

            {/* Bottom security banner */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span>
                Első belépéskor a jelszó megváltoztatása kötelező. A rendszer csak az új, egyedi jelszóval enged be.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isModal && (
        <div className="w-full text-center text-slate-500 text-xs py-2 border-t border-slate-800/60 mt-4">
          © 2026 Esettanulmányok — Minőségbiztosítási Rendszer
        </div>
      )}
    </div>
  </div>
  );
};
