import React, { useState } from 'react';
import { FileCheck, BookOpen, ShieldCheck, UserCheck, Briefcase, BarChart3, Users, RefreshCw, LogOut, Key, Building2, Link2, Check } from 'lucide-react';
import { PannonJobLogo } from './PannonJobLogo';
import { Employee } from '../types';

export type MainPortalRole = 'employee' | 'admin';

export type AdminSubTab = 'evaluations' | 'reports' | 'assignments' | 'departments' | 'cases' | 'standards';

interface NavbarProps {
  currentRole: MainPortalRole;
  setCurrentRole: (role: MainPortalRole) => void;
  adminSubTab: AdminSubTab;
  setAdminSubTab: (tab: AdminSubTab) => void;
  pendingReviewsCount: number;
  isSyncing?: boolean;
  onManualSync?: () => void;
  lastSyncedTime?: string | null;
  currentUser?: Employee | null;
  onLogout?: () => void;
  onOpenUserSwitch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  setCurrentRole,
  adminSubTab,
  setAdminSubTab,
  pendingReviewsCount,
  isSyncing = false,
  onManualSync,
  lastSyncedTime,
  currentUser,
  onLogout,
  onOpenUserSwitch,
}) => {
  const isAdminUser = currentUser?.role === 'admin';
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyShareLink = () => {
    // Generate clean direct login URL with ?login=true so recipient is prompted to log in as themselves
    const url = `${window.location.origin}?login=true`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header className="bg-slate-950 text-white border-b border-slate-800 shadow-lg z-30">
      {/* TIER 1: BRANDING, LOGO, LIVE CLOUD & USER PROFILE */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Logo & Branding */}
          <div
            className="flex items-center space-x-3.5 cursor-pointer group"
            onClick={() => {
              if (isAdminUser) setCurrentRole('admin');
              else setCurrentRole('employee');
            }}
          >
            {/* Official Branding Logo */}
            <PannonJobLogo variant="light" size="md" showSubtitle={false} />
          </div>

          {/* Right side: Sync status & User Profile Controls */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* Shared Live Database Sync Indicator */}
            {onManualSync && (
              <button
                onClick={onManualSync}
                disabled={isSyncing}
                title="Központi felhő szinkronizálása (mindenki látja a friss eseteket és feladatokat)"
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400/50 transition-all cursor-pointer group"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-emerald-400 group-hover:rotate-180 transition-transform duration-500 ${
                    isSyncing ? 'animate-spin' : ''
                  }`}
                />
                <span className="text-[11px]">
                  {isSyncing ? 'Szinkronizálás...' : 'Közös felhő'}
                </span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </button>
            )}

            {/* Copy direct login link button */}
            <button
              onClick={handleCopyShareLink}
              title="Bejelentkezési link másolása a vágólapra másoknak való elküldéshez"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-400/50 transition-all cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] text-emerald-300 font-bold">Link másolva!</span>
                </>
              ) : (
                <>
                  <Link2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px]">Bejelentkezési link</span>
                </>
              )}
            </button>

            {/* Current user badge & Logout */}
            <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs">
              {currentUser ? (
                <div className="flex items-center space-x-2.5 text-left">
                  <div
                    className={`w-8 h-8 rounded-full font-black flex items-center justify-center text-xs shadow-xs ${
                      isAdminUser
                        ? 'bg-purple-900 text-purple-200 border border-purple-400/50'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {currentUser.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-slate-200 block text-xs leading-tight">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-amber-400 font-semibold block">
                      {isAdminUser ? '👑 Vezető / Értékelő' : '👤 Munkavállaló'}
                    </span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={onOpenUserSwitch}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 cursor-pointer shadow-sm"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Belépés</span>
                </button>
              )}

              {onLogout && currentUser && (
                <button
                  onClick={onLogout}
                  title="Kijelentkezés a fiókból"
                  className="px-2 py-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 rounded-xl border border-slate-700 hover:border-red-600 transition-all cursor-pointer flex items-center space-x-1 ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-bold">Kilépés</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TIER 2: PRIMARY ROLE SWITCHER (Munkatárs Portál vs Vezetői & HR Felület) & SUB-MENU */}
      <div className="bg-slate-900 border-t border-slate-800/90 py-2.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Main Role Selector Tabs with High Visual Contrast */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mr-1 hidden sm:block">
              Felület váltó:
            </div>

            <div className="inline-flex p-1 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
              {/* MUNKATÁRS PORTÁL GOMB */}
              <button
                type="button"
                onClick={() => setCurrentRole('employee')}
                className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  currentRole === 'employee'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md scale-100 ring-2 ring-amber-400/40'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Munkatárs Portál</span>
                {currentRole === 'employee' && (
                  <span className="ml-1.5 px-2 py-0.5 bg-slate-950/20 text-slate-950 text-[10px] font-black rounded-full uppercase">
                    Aktív
                  </span>
                )}
              </button>

              {/* VEZETŐI & HR GOMB */}
              {isAdminUser ? (
                <button
                  type="button"
                  onClick={() => setCurrentRole('admin')}
                  className={`flex items-center space-x-2 px-3.5 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer relative ${
                    currentRole === 'admin'
                      ? 'bg-gradient-to-r from-purple-700 to-indigo-600 text-white shadow-md scale-100 ring-2 ring-purple-400/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span>Vezetői & HR Felület</span>
                  {pendingReviewsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 bg-red-500 text-white text-[10px] font-black rounded-full animate-pulse">
                      {pendingReviewsCount}
                    </span>
                  )}
                  {currentRole === 'admin' && (
                    <span className="ml-1.5 px-2 py-0.5 bg-white/20 text-white text-[10px] font-black rounded-full uppercase">
                      Aktív
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onOpenUserSwitch}
                  title="A Vezetői & HR felülethez Vezetői fiók szükséges (pl. Kármán Veronika). Kattints a profilváltáshoz!"
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-900 transition-colors cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>Vezetői & HR Felület (Zárolva)</span>
                </button>
              )}
            </div>

          </div>

          {/* Admin Submenu if Admin role is active */}
          {currentRole === 'admin' && isAdminUser && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs w-full lg:w-auto overflow-x-auto">
              <button
                onClick={() => setAdminSubTab('evaluations')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  adminSubTab === 'evaluations'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Értékelések</span>
              </button>

              <button
                onClick={() => setAdminSubTab('reports')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  adminSubTab === 'reports'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Riportok</span>
              </button>

              <button
                onClick={() => setAdminSubTab('assignments')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  adminSubTab === 'assignments'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>Esetkiosztás</span>
              </button>

              <button
                onClick={() => setAdminSubTab('departments')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  adminSubTab === 'departments'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Részlegek</span>
              </button>

              <button
                onClick={() => setAdminSubTab('cases')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  adminSubTab === 'cases'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                <span>Esetek</span>
              </button>

              <button
                onClick={() => setAdminSubTab('standards')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-colors cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
                  adminSubTab === 'standards'
                    ? 'bg-purple-900/80 text-purple-200 border border-purple-500/40 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Standardok</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

