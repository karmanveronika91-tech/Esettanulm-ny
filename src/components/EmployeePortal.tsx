import React, { useState } from 'react';
import { CaseStudy, CustomerServicePillar, Submission, Employee, CaseAssignment, SentEmailNotification } from '../types';
import { parseDocxFile } from '../utils/docxParser';
import { PannonJobLogo } from './PannonJobLogo';
import { PANNONJOB_DEPARTMENTS } from '../data/pannonjobDepartments';
import { sendEvaluationCompletedEmail, getSentEmails } from '../services/notificationService';
import { SentEmailViewerModal } from './SentEmailViewerModal';
import {
  FileText,
  Mail,
  Upload,
  User,
  Building,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  RefreshCw,
  Eye,
  EyeOff,
  FileCheck,
  Clock,
  ShieldCheck,
  Check,
  KeyRound,
  Lock,
  Briefcase,
  UserCheck,
} from 'lucide-react';
import { verifyEmployeePassword } from '../utils/authUtils';

interface EmployeePortalProps {
  caseStudies: CaseStudy[];
  customerStandards: CustomerServicePillar[];
  submissions: Submission[];
  currentUser?: Employee | null;
  assignments?: CaseAssignment[];
  departments?: string[];
  onSubmitNew: (submission: Submission) => void;
  onEmployeeDecision: (submissionId: string, decision: 'accepted' | 'redo') => void;
  onViewDetailedResult: (submission: Submission) => void;
  onUpdateEmployee?: (updatedEmployee: Employee) => Promise<void> | void;
  onOpenLogin?: () => void;
  onNavigateToAssignments?: () => void;
}

export const EmployeePortal: React.FC<EmployeePortalProps> = ({
  caseStudies,
  customerStandards,
  submissions,
  currentUser,
  assignments = [],
  departments,
  onSubmitNew,
  onEmployeeDecision,
  onViewDetailedResult,
  onUpdateEmployee,
  onOpenLogin,
  onNavigateToAssignments,
}) => {
  const departmentsList = departments && departments.length > 0 ? departments : Array.from(PANNONJOB_DEPARTMENTS);
  const [subTab, setSubTab] = useState<'submit' | 'my_results' | 'account'>('submit');

  // Employee Form State
  const [colleagueName, setColleagueName] = useState(currentUser?.name || '');
  const [colleagueEmail, setColleagueEmail] = useState(currentUser?.email || '');
  const [department, setDepartment] = useState<string>(currentUser?.department || departmentsList[0]);
  
  // Sent email viewing state
  const [latestDispatchedEmail, setLatestDispatchedEmail] = useState<SentEmailNotification | null>(null);
  const [viewingEmailCopy, setViewingEmailCopy] = useState<SentEmailNotification | null>(null);

  // Password modification state for "Fiókom" tab
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showAccountPasswords, setShowAccountPasswords] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState<string | null>(null);
  const [passwordErrorMessage, setPasswordErrorMessage] = useState<string | null>(null);

  // Auto-fill employee details when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setColleagueName(currentUser.name);
      setColleagueEmail(currentUser.email);
      setDepartment(currentUser.department);
    }
  }, [currentUser]);

  // Current user's active assignments strictly from "Esetek kiosztása"
  const myAssignments = assignments.filter((a) => {
    if (!a.assignedEmployees || a.assignedEmployees.length === 0) return false;
    if (currentUser) {
      return a.assignedEmployees.some(
        (e) =>
          e.id === currentUser.id ||
          (e.email && currentUser.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (e.name && currentUser.name && e.name.toLowerCase() === currentUser.name.toLowerCase())
      );
    }
    if (colleagueEmail) {
      return a.assignedEmployees.some(
        (e) => e.email && e.email.toLowerCase() === colleagueEmail.toLowerCase()
      );
    }
    if (colleagueName) {
      return a.assignedEmployees.some(
        (e) => e.name && e.name.toLowerCase().includes(colleagueName.toLowerCase())
      );
    }
    return false;
  });

  const [activeAssignmentId, setActiveAssignmentId] = useState<string>('');

  // Keep active assignment synchronized with myAssignments
  React.useEffect(() => {
    if (myAssignments.length > 0) {
      const exists = myAssignments.some((a) => a.id === activeAssignmentId);
      if (!exists) {
        setActiveAssignmentId(myAssignments[0].id);
      }
    } else {
      setActiveAssignmentId('');
    }
  }, [myAssignments, activeAssignmentId]);

  // Automatically selected assigned case - employee CANNOT choose arbitrary cases
  const currentAssignment = myAssignments.find((a) => a.id === activeAssignmentId) || myAssignments[0] || null;
  const selectedCase = currentAssignment
    ? caseStudies.find((c) => c.id === currentAssignment.caseStudyId) || null
    : null;

  // 1. Task Content & Doc State
  const [taskContent, setTaskContent] = useState('');
  const [taskFileName, setTaskFileName] = useState<string>('');
  const [isReadingTaskDoc, setIsReadingTaskDoc] = useState(false);

  // 2. Email Content & Doc State
  const [emailContent, setEmailContent] = useState('');
  const [emailFileName, setEmailFileName] = useState<string>('');
  const [isReadingEmailDoc, setIsReadingEmailDoc] = useState(false);

  // Submission loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // My filtered submissions
  const mySubmissions = submissions.filter(
    (s) =>
      (colleagueEmail && s.colleagueEmail.toLowerCase() === colleagueEmail.toLowerCase()) ||
      (colleagueName && s.colleagueName.toLowerCase().includes(colleagueName.toLowerCase())) ||
      !colleagueEmail // if no email typed yet, show all or recent
  );

  // Handle Task Doc Upload
  const handleTaskDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingTaskDoc(true);
    setSubmitError(null);
    try {
      const text = await parseDocxFile(file);
      setTaskContent(text);
      setTaskFileName(file.name);
    } catch (err: any) {
      setSubmitError(`Hiba a feladat Word dokumentum beolvasásakor: ${err.message}`);
    } finally {
      setIsReadingTaskDoc(false);
    }
  };

  // Handle Email Doc Upload
  const handleEmailDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReadingEmailDoc(true);
    setSubmitError(null);
    try {
      const text = await parseDocxFile(file);
      setEmailContent(text);
      setEmailFileName(file.name);
    } catch (err: any) {
      setSubmitError(`Hiba a levél Word dokumentum beolvasásakor: ${err.message}`);
    } finally {
      setIsReadingEmailDoc(false);
    }
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) {
      setSubmitError('Nincs aktív kiosztott esettanulmányod! Csak a vezetőd által kijelölt feladatot tudod beküldeni.');
      return;
    }
    if (!colleagueName.trim()) {
      setSubmitError('Kérjük, add meg a nevedet!');
      return;
    }
    if (!colleagueEmail.trim()) {
      setSubmitError('Kérjük, add meg az e-mail címedet az automatikus értesítéshez!');
      return;
    }
    if (!taskContent.trim() && !emailContent.trim()) {
      setSubmitError('Kérjük, töltsd fel a feladatkidolgozást és a tájékoztató levelet is!');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/evaluate-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudy: selectedCase,
          taskContent,
          emailContent,
          customerStandards,
          colleagueName,
          colleagueEmail,
          department,
        }),
      });

      const responseText = await response.text();
      let resultPayload: any;
      try {
        resultPayload = JSON.parse(responseText);
      } catch {
        throw new Error(
          `A szerver nem adott érvényes JSON választ (${response.status}). Kérjük, kattints az újrapróbálásra!`
        );
      }

      if (!response.ok || !resultPayload.success) {
        const userMsg =
          resultPayload?.error ||
          `Szerver hiba a kiértékelés során (${response.status}). Kérjük, próbáld újra!`;
        throw new Error(userMsg);
      }

      const evalData = resultPayload.data;

      const newSubmission: Submission = {
        id: `sub-${Date.now()}`,
        caseStudyId: selectedCase.id,
        caseStudyTitle: selectedCase.title,
        colleagueName,
        colleagueEmail,
        department,
        submittedAt: new Date().toISOString(),
        taskDocFileName: taskFileName || 'feladat_megoldas.docx',
        taskContent,
        emailDocFileName: emailFileName || 'tajekoztato_level.docx',
        emailContent,
        taskScore: evalData.taskScore ?? evalData.taskEvaluation?.score ?? 0,
        emailScore: evalData.emailScore ?? evalData.emailEvaluation?.score ?? 0,
        overallScore: evalData.overallScore ?? 0,
        status: 'pending_review',
        taskEvaluation: evalData.taskEvaluation,
        emailEvaluation: evalData.emailEvaluation,
        notificationSent: false,
      };

      onSubmitNew(newSubmission);
      
      // Reset uploaded files for clean state
      setTaskContent('');
      setTaskFileName('');
      setEmailContent('');
      setEmailFileName('');
      
      setSubmitSuccess(true);
      setSubTab('my_results');
    } catch (err: any) {
      console.error('Submission failed:', err);
      setSubmitError(err.message || 'Nem sikerült a dokumentumok beküldése.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password modification handler for "Fiókom"
  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMessage(null);
    setPasswordSuccessMessage(null);

    if (!currentUser) {
      setPasswordErrorMessage('Nem található aktív bejelentkezett felhasználó!');
      return;
    }

    // 1. Verify current password
    const isCurrentValid = verifyEmployeePassword(currentPasswordInput.trim(), currentUser);
    if (!isCurrentValid) {
      setPasswordErrorMessage('A megadott jelenlegi jelszó hibás! Kérjük, ellenőrizd a jelenlegi jelszavadat.');
      return;
    }

    // 2. Validate new password length
    const newPassTrimmed = newPasswordInput.trim();
    if (newPassTrimmed.length < 6) {
      setPasswordErrorMessage('Az új jelszónak legalább 6 karakterből kell állnia!');
      return;
    }

    // 3. New password != current password
    if (newPassTrimmed === currentPasswordInput.trim()) {
      setPasswordErrorMessage('Az új jelszó nem egyezhet meg a jelenlegi jelszóval!');
      return;
    }

    // 4. Confirm new password matches
    if (newPassTrimmed !== confirmPasswordInput.trim()) {
      setPasswordErrorMessage('Az új jelszó és a megerősítése nem egyezik!');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const updatedUser: Employee = {
        ...currentUser,
        password: newPassTrimmed,
        mustChangePassword: false,
        passwordChangedAt: new Date().toISOString(),
      };

      if (onUpdateEmployee) {
        await onUpdateEmployee(updatedUser);
      }

      setPasswordSuccessMessage(
        'A jelszavad sikeresen megváltozott! A következő bejelentkezéskor már az új jelszavaddal tudsz belépni.'
      );
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setPasswordErrorMessage(`Hiba a jelszó mentése során: ${err?.message || 'Ismeretlen hiba'}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub tabs for employee */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setSubTab('submit');
              setSubmitSuccess(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'submit'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Kiosztott Feladat & Levél Feltöltése</span>
          </button>

          <button
            onClick={() => setSubTab('my_results')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'my_results'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Saját Értékeléseim & Visszajelzéseim ({mySubmissions.length})</span>
          </button>

          <button
            onClick={() => setSubTab('account')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === 'account'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Fiókom & Jelszó</span>
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Munkatárs: <span className="font-bold text-slate-800">{colleagueName || 'Vendég felhasználó'}</span>
        </div>
      </div>

      {subTab === 'submit' && (
        <div className="space-y-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
              <div className="flex items-center space-x-3">
                <PannonJobLogo variant="light" size="sm" showSubtitle={false} showSymbolOnly={true} />
                <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-md border border-amber-400/30">
                  Munkatársi Felület
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                Töltsd fel a vezetőd által kiosztott feladatmegoldásodat és a hozzákapcsolódó tájékoztató leveledet két külön Word dokumentumban (.docx). A beküldést követően a feladatod rögzítésre kerül; a vezetői vagy HR értékelést követően e-mailben kapsz értesítést a pontos minősítésről és szöveges visszajelzésről.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Colleague Identification Section */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <User className="w-5 h-5 text-amber-600" />
                  <span>1. Munkatárs Adatai</span>
                </h2>
                {currentUser && (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Törzsadatbázisból automatikusan beemelve</span>
                  </span>
                )}
              </div>

              {currentUser ? (
                /* Auto-filled from imported database - user doesn't need to re-enter anything */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-amber-400 font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-slate-900 text-sm">{currentUser.name}</span>
                        <span className="text-[11px] font-mono text-slate-500">(@{currentUser.username})</span>
                      </div>
                      <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
                        <span><strong>E-mail:</strong> {currentUser.email}</span>
                        <span>•</span>
                        <span><strong>Részleg:</strong> {currentUser.department}</span>
                        {currentUser.position && (
                          <>
                            <span>•</span>
                            <span><strong>Munkakör:</strong> {currentUser.position}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-500 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    🔒 Adataid védettek és zároltak. A kiértékelés eredménye közvetlenül ehhez a profilhoz rögzül.
                  </div>
                </div>
              ) : (
                /* Fallback if user is not logged in */
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Teljes Neved *</label>
                    <input
                      type="text"
                      required
                      value={colleagueName}
                      onChange={(e) => setColleagueName(e.target.value)}
                      placeholder="pl. Kovács Anna"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">E-mail címed (értesítéshez) *</label>
                    <input
                      type="email"
                      required
                      value={colleagueEmail}
                      onChange={(e) => setColleagueEmail(e.target.value)}
                      placeholder="kovacs.anna@ceg.hu"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Munkaterület / Részleg / Osztály *</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
                    >
                      {departmentsList.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Assigned Case Study (Strictly from assignments, no arbitrary picking) */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-amber-600" />
                  <span>2. Kiosztott Feladat</span>
                </h2>

                {myAssignments.length > 1 ? (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-bold hidden sm:inline">Kiosztott feladat:</span>
                    <select
                      value={activeAssignmentId}
                      onChange={(e) => setActiveAssignmentId(e.target.value)}
                      className="bg-slate-50 border border-amber-300 text-slate-900 text-xs font-bold rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-amber-500"
                    >
                      {myAssignments.map((asgn, i) => (
                        <option key={asgn.id} value={asgn.id}>
                          #{i + 1}. Kiosztott eset: {asgn.caseStudyTitle} (Határidő: {asgn.deadline})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : myAssignments.length === 1 && selectedCase ? (
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-lg text-xs border border-amber-200">
                    Kiosztott feladat: #{selectedCase.caseNumber || 1}. Esettanulmány
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-lg text-xs">
                    Nincs aktív kiosztás
                  </span>
                )}
              </div>

              {/* Empty state when no assignment exists */}
              {myAssignments.length === 0 ? (
                <div className="p-6 sm:p-8 bg-amber-50/60 border border-amber-200/80 rounded-2xl text-center space-y-3">
                  <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="font-extrabold text-slate-900 text-sm">
                      Jelenleg nincs számodra kiosztott esettanulmány
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      A feladatokat a munkatársak nem választhatják ki önállóan: az esettanulmányt a vezetőd jelöli ki számodra az <strong>Esetek kiosztása</strong> menüben. Amint megkapod a feladatodat, az automatikusan itt fog megjelenni a határidővel és az utasításokkal!
                    </p>
                  </div>
                  {currentUser?.role === 'admin' && onNavigateToAssignments && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={onNavigateToAssignments}
                        className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-purple-100 font-bold rounded-xl text-xs transition-colors cursor-pointer inline-flex items-center space-x-2 shadow-sm"
                      >
                        <Briefcase className="w-4 h-4 text-amber-400" />
                        <span>Esetkiosztás megnyitása (Vezetői felület)</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Active Assignment Metadata Card */}
                  {currentAssignment && (() => {
                    const isAssignmentExpired = currentAssignment.status === 'expired' || (() => {
                      if (currentAssignment.status === 'completed' || currentAssignment.status === 'submitted') return false;
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const dl = new Date(currentAssignment.deadline);
                      dl.setHours(0, 0, 0, 0);
                      return !isNaN(dl.getTime()) && dl.getTime() < today.getTime();
                    })();

                    return (
                      <div className={`p-4 rounded-2xl space-y-3 border-2 ${
                        isAssignmentExpired
                          ? 'bg-red-50/50 border-red-300'
                          : 'bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-purple-500/10 border-amber-400/60'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-xs shadow-xs flex items-center space-x-1">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Vezetői Kiosztás</span>
                            </span>
                            <span className="text-xs font-extrabold text-slate-900">
                              {currentAssignment.caseStudyTitle}
                            </span>
                          </div>

                          <div className="flex items-center space-x-1.5">
                            {isAssignmentExpired && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 border border-red-300 rounded-md text-[11px] font-black">
                                Lejárt státusz
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border shadow-2xs ${
                              isAssignmentExpired
                                ? 'bg-white text-red-800 border-red-300'
                                : 'text-slate-700 bg-white border-slate-200'
                            }`}>
                              📅 Határidő: <span className={isAssignmentExpired ? 'text-red-900 font-black' : 'text-amber-800 font-extrabold'}>{currentAssignment.deadline}</span>
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 space-y-1 bg-white/80 p-3 rounded-xl border border-amber-200/60">
                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-medium gap-y-1">
                            <span>Kiosztó vezető: <strong className="text-slate-800">{currentAssignment.assignedBy}</strong></span>
                            <span>Típus: <strong className="text-slate-800">{currentAssignment.assignmentType === 'pair' ? '👥 Kétfős csoport' : '👤 Egyéni feladat'}</strong></span>
                            {currentAssignment.assignedAt && (
                              <span>Kiosztva: <strong className="text-slate-800">{new Date(currentAssignment.assignedAt).toLocaleDateString('hu-HU')}</strong></span>
                            )}
                          </div>
                          {currentAssignment.instructions && (
                            <p className="text-slate-800 font-medium pt-1 border-t border-slate-100">
                              💬 <em>"{currentAssignment.instructions}"</em>
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Case Study Details */}
                  {selectedCase && (
                    <div className="space-y-4 text-xs">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex items-center space-x-2 mb-1.5">
                          <span className="px-2 py-0.5 bg-slate-900 text-amber-400 font-black rounded text-[11px]">
                            #{selectedCase.caseNumber || caseStudies.findIndex(c => c.id === selectedCase.id) + 1}. Esettanulmány
                          </span>
                          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                            {selectedCase.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mb-2">{selectedCase.title}</h3>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">{selectedCase.description}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200">
                          <span className="font-bold text-amber-950 block mb-1 text-sm">
                            📋 1. Dokumentum: Feladatkidolgozás kérdései
                          </span>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-line text-xs font-medium">
                            {selectedCase.taskQuestions}
                          </p>
                        </div>

                        <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200">
                          <span className="font-bold text-blue-950 block mb-1 text-sm">
                            ✉️ 2. Dokumentum: Tájékoztató levél feladat
                          </span>
                          <p className="text-slate-800 leading-relaxed text-xs font-medium">
                            A fenti esetleírás alapján készíts egy professzionális, ügyfélközpontú tájékoztató levelet (e-mailt) az érintettek felé. A levél hangneme, szakmai pontossága és az ügyfélszolgálati elvárásoknak való megfelelés önállóan kerül kiértékelésre.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 3. Two Separate Document Uploads (Word docx) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document 1: Task Questions Solution */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>1. Dokumentum: Feladatmegoldás (.docx)</span>
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500">
                    Töltsd fel a feladatkidolgozást és a kérdésekre adott válaszokat Word dokumentumban (.docx).
                  </p>

                  {/* Upload Box */}
                  {!taskFileName ? (
                    <label className="border-2 border-dashed border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px]">
                      <input
                        type="file"
                        accept=".docx,.doc,.txt"
                        onChange={handleTaskDocUpload}
                        className="hidden"
                      />
                      {isReadingTaskDoc ? (
                        <div className="flex items-center space-x-2 text-xs font-bold text-amber-700">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Word dokumentum beolvasása...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            Kattints ide a Word dokumentum (.docx) feltöltéséhez
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            vagy húzd ide a fájlt (DOCX formátum)
                          </span>
                        </>
                      )}
                    </label>
                  ) : (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          DOCX
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{taskFileName}</span>
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dokumentum sikeresen beolvasva ({taskContent.length} karakter)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="file"
                            accept=".docx,.doc,.txt"
                            onChange={handleTaskDocUpload}
                            className="hidden"
                          />
                          Csere
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskContent('');
                            setTaskFileName('');
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-white px-2.5 py-1.5 rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Document 2: Email Draft */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>2. Dokumentum: Tájékoztató Levél (.docx)</span>
                    </h3>
                  </div>

                  <p className="text-xs text-slate-500">
                    Töltsd fel az ügyfélnek / munkavállalóknak megírt tájékoztató e-mailt Word formátumban (.docx).
                  </p>

                  {/* Upload Box */}
                  {!emailFileName ? (
                    <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[140px]">
                      <input
                        type="file"
                        accept=".docx,.doc,.txt"
                        onChange={handleEmailDocUpload}
                        className="hidden"
                      />
                      {isReadingEmailDoc ? (
                        <div className="flex items-center space-x-2 text-xs font-bold text-blue-700">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Word dokumentum beolvasása...</span>
                        </div>
                      ) : (
                        <>
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                            <Upload className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-bold text-slate-800">
                            Kattints ide a Word dokumentum (.docx) feltöltéséhez
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            vagy húzd ide a fájlt (DOCX formátum)
                          </span>
                        </>
                      )}
                    </label>
                  ) : (
                    <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          DOCX
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{emailFileName}</span>
                          <span className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Dokumentum sikeresen beolvasva ({emailContent.length} karakter)</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="file"
                            accept=".docx,.doc,.txt"
                            onChange={handleEmailDocUpload}
                            className="hidden"
                          />
                          Csere
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailContent('');
                            setEmailFileName('');
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700 bg-white px-2.5 py-1.5 rounded-lg border border-red-200 cursor-pointer hover:bg-red-50 transition-colors"
                        >
                          Törlés
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 text-xs sm:text-sm font-medium">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  <span>{submitError}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto flex-shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                  <span>Újrapróbálás</span>
                </button>
              </div>
            )}

            {/* Submit Action */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-700 block">Minőségbiztosítási folyamat:</span>
                A feladat és a tájékoztató levél beküldésekor a rendszer a legutóbbi értékelési standardok alapján azonnal elvégzi a részletes szakmai kiértékelést, majd a megoldást továbbítja a vezetői jóváhagyási sorba.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center justify-center space-x-2 px-8 py-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 flex-shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Dokumentumok és Levél Kiértékelése folyamatban...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Esettanulmány Megoldások Beküldése</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab: My Results & Decisions */}
      {subTab === 'my_results' && (
        <div className="space-y-6">
          {submitSuccess && (
            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-amber-50 to-emerald-50 border-2 border-amber-400/80 rounded-3xl shadow-md flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
                <Clock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-amber-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-md">
                    Állapot: Vezetői / HR elbírálásra vár
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    {new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-950 text-base sm:text-lg tracking-tight">
                  Sikeres beküldés! Hamarosan kapsz visszajelzést.
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  A feladatmegoldásodat és a tájékoztató leveledet rögzítettük. Az eredmény jelenleg még nem látható, mert a vezetőd vagy a HR felülvizsgálja és értékeli az anyagot. Amikor a vezető vagy a HR értékelte, automatikus e-mail értesítést kapsz róla, és a felületre belépve megtekintheted a pontos értékelést.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
                <FileCheck className="w-6 h-6 text-amber-600" />
                <span>Beküldött Feladataim és Eredményeim</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Itt követheted nyomon a leadott eseteid állapotát, a vezetői jóváhagyást követően pedig a pontos pontszámokat és a visszajelzéseket.
              </p>
            </div>

            <button
              onClick={() => {
                setSubTab('submit');
                setSubmitSuccess(false);
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              + Újabb Eset Beküldése
            </button>
          </div>

          {mySubmissions.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 space-y-3">
              <FileText className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">Még nincs beküldött esettanulmányod.</p>
              <p className="text-xs text-slate-500">
                Kattints az "Új Feladat & Levél Feltöltése" gombra a megkezdéshez!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {mySubmissions.map((sub) => {
                const isPending = sub.status === 'pending_review';
                const isApproved = sub.status === 'approved' || sub.status === 'accepted';
                const isBelowThreshold = sub.overallScore < 75 || sub.taskScore < 75 || sub.emailScore < 75;

                return (
                  <div
                    key={sub.id}
                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Header Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md">
                            {sub.department}
                          </span>
                          <span className="text-xs text-slate-400">
                            Beküldve: {new Date(sub.submittedAt).toLocaleString('hu-HU')}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{sub.caseStudyTitle}</h3>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPending && (
                          <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-200 inline-flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                            <span>⏳ Vezetői / HR jóváhagyásra vár</span>
                          </span>
                        )}
                        {sub.status === 'approved' && (
                          <span className="bg-blue-100 text-blue-900 text-xs font-bold px-3 py-1.5 rounded-full border border-blue-200 inline-flex items-center space-x-1.5">
                            <span>✅ Vezető jóváhagyta – Döntésedre vár</span>
                          </span>
                        )}
                        {sub.status === 'accepted' && (
                          <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 inline-flex items-center space-x-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            <span>Értékelés Elfogadva</span>
                          </span>
                        )}
                        {sub.status === 'redo_required' && (
                          <span className="bg-red-100 text-red-900 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 inline-flex items-center space-x-1.5">
                            <AlertCircle className="w-4 h-4 text-red-700" />
                            <span>75% alatt – Újradolgozás kötelező</span>
                          </span>
                        )}
                        {sub.status === 'redo_requested' && (
                          <span className="bg-orange-100 text-orange-900 text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200 inline-flex items-center space-x-1.5">
                            <RefreshCw className="w-4 h-4 text-orange-700" />
                            <span>Újradolgozás folyamatban</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Scores Breakdown - Masked if still in pending review */}
                    {isPending ? (
                      <div className="p-5 bg-gradient-to-br from-amber-50/90 to-amber-100/40 rounded-2xl border-2 border-dashed border-amber-300 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-amber-950 shadow-xs">
                        <div className="flex items-center space-x-3.5">
                          <div className="w-10 h-10 rounded-2xl bg-amber-400/80 text-amber-950 flex items-center justify-center font-bold text-lg shadow-2xs flex-shrink-0">
                            ⏳
                          </div>
                          <div className="space-y-0.5">
                            <span className="font-extrabold block text-sm text-amber-950">
                              Hamarosan kapsz visszajelzést (Vezetői / HR ellenőrzés folyamatban)
                            </span>
                            <span className="text-slate-600 text-xs leading-relaxed block">
                              A feladatmegoldásodat és tájékoztató leveledet rögzítettük. Az eredmény jelenleg még nem látható. Amikor a vezető vagy a HR értékelte az esetet, automatikus e-mail értesítést kapsz róla, és a felületre belépve itt láthatod majd a pontos értékelést.
                            </span>
                          </div>
                        </div>
                        <span className="px-3.5 py-1.5 bg-amber-200/90 rounded-xl border border-amber-300/80 font-bold text-amber-950 text-xs shadow-2xs flex-shrink-0">
                          Értékelésre vár
                        </span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">1. Feladatkidolgozás</span>
                          <div className="flex items-baseline space-x-2 mt-1">
                            <span
                              className={`text-2xl font-black ${
                                sub.taskScore >= 75 ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {sub.taskScore}%
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {sub.taskEvaluation?.overallTaskRating || 'Kiértékelve'}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="text-[11px] font-bold text-slate-500 uppercase block">2. Tájékoztató Levél</span>
                          <div className="flex items-baseline space-x-2 mt-1">
                            <span
                              className={`text-xl sm:text-2xl font-black ${
                                sub.emailScore >= 75 ? 'text-emerald-700' : 'text-red-600'
                              }`}
                            >
                              {sub.emailScore >= 75 ? 'Sikeres' : 'Sikertelen'}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              {sub.emailEvaluation?.scoreOutOf10
                                ? `${sub.emailEvaluation.scoreOutOf10}/10 pont`
                                : `${Math.round(sub.emailScore / 10)}/10 pont`}
                            </span>
                          </div>
                        </div>

                        <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
                          <span className="text-[11px] font-bold text-amber-900 uppercase block">Összesített Átlag</span>
                          <div className="flex items-baseline space-x-2 mt-1">
                            <span
                              className={`text-2xl font-black ${
                                sub.overallScore >= 75 ? 'text-amber-800' : 'text-red-600'
                              }`}
                            >
                              {sub.overallScore}%
                            </span>
                            <span className="text-xs font-bold text-amber-900">
                              {sub.overallScore >= 75 ? 'Megfelelt' : '75% alatti'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manager Feedback Note (if reviewed) */}
                    {!isPending && sub.managerNotes && (
                      <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200 text-xs">
                        <span className="font-bold text-blue-950 block mb-1">
                          👔 Vezetői / HR Megjegyzés ({sub.reviewedBy || 'Vezető'}):
                        </span>
                        <p className="text-blue-900">{sub.managerNotes}</p>
                      </div>
                    )}

                    {/* Decision Action Area */}
                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        {isPending && (
                          <div className="text-xs text-slate-500 italic">
                            A feladat beérkezett, hamarosan jóváhagyja a HR / Területi Vezető.
                          </div>
                        )}

                        {sub.status === 'approved' && isBelowThreshold && (
                          <div className="text-xs text-red-700 font-bold flex items-center space-x-1.5">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>
                              Az eredmény nem érte el a 75%-ot. A feladatot és a levelet kötelező újra elkészíteni!
                            </span>
                          </div>
                        )}

                        {sub.status === 'approved' && !isBelowThreshold && (
                          <div className="text-xs text-slate-600">
                            A vezetőd jóváhagyta az értékelést. Elfogadod az eredményt, vagy szeretnéd újra elkészíteni?
                          </div>
                        )}

                        {sub.status === 'accepted' && (
                          <div className="text-xs text-emerald-700 font-medium">
                            Gratulálunk! Az értékelést sikeresen elfogadtad.
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                        {isPending ? (
                          <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200 inline-flex items-center space-x-1.5">
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Visszajelzés hamarosan (Értékelés alatt)</span>
                          </span>
                        ) : (
                          <>
                            {/* Allow viewing the detailed evaluation */}
                            <button
                              onClick={() => onViewDetailedResult(sub)}
                              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                            >
                              <Eye className="w-3.5 h-3.5 text-amber-400" />
                              <span>Részletes Eredmények Megtekintése</span>
                            </button>

                            {/* View sent notification email */}
                            <button
                              onClick={() => {
                                const allSent = getSentEmails();
                                const found = allSent.find((m) => m.submissionId === sub.id) || {
                                  id: `mail-adhoc-${sub.id}`,
                                  submissionId: sub.id,
                                  recipientEmail: sub.colleagueEmail,
                                  recipientName: sub.colleagueName,
                                  caseStudyTitle: sub.caseStudyTitle,
                                  subject: `[Értesítés] Esettanulmány Kiértékelés Jóváhagyva - ${sub.caseStudyTitle}`,
                                  sentAt: sub.submittedAt,
                                  type: 'evaluation_completed',
                                  bodyHtml: `<p>Tisztelt <strong>${sub.colleagueName}</strong>!</p><p>Az esettanulmány kiértékelése sikeresen rögzítésre került és jóváhagyásra került.</p>`,
                                  bodyText: `Tisztelt ${sub.colleagueName}!\n\nAz esettanulmány kiértékelése jóváhagyva.`,
                                };
                                setViewingEmailCopy(found);
                              }}
                              className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer border border-slate-200"
                              title="A jóváhagyáskor kiküldött hivatalos e-mail másolata"
                            >
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span className="hidden sm:inline">Kiküldött E-mail</span>
                            </button>

                            {/* If status is approved and < 75%: Redo required */}
                            {sub.status === 'approved' && isBelowThreshold && (
                              <button
                                onClick={() => {
                                  onEmployeeDecision(sub.id, 'redo');
                                  setSubTab('submit');
                                }}
                                className="flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Kötelező Újradolgozás Indítása</span>
                              </button>
                            )}

                            {/* If status is approved and >= 75%: Can accept or redo */}
                            {sub.status === 'approved' && !isBelowThreshold && (
                              <>
                                <button
                                  onClick={() => {
                                    onEmployeeDecision(sub.id, 'redo');
                                    setSubTab('submit');
                                  }}
                                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Nem fogadom el, újra elkészítem</span>
                                </button>

                                <button
                                  onClick={() => onEmployeeDecision(sub.id, 'accepted')}
                                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Elfogadom az Értékelést</span>
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* SubTab: Account & Password Management ("Fiókom") */}
      {subTab === 'account' && (
        <div className="space-y-6 max-w-3xl mx-auto">
          {currentUser ? (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-amber-400 font-black text-xl flex items-center justify-center shadow-md border border-slate-700">
                      {currentUser.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-black text-slate-900">{currentUser.name}</h2>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          {currentUser.role === 'admin' ? '👑 Vezető' : '👤 Munkatárs'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">@{currentUser.username}</p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500">
                    <div className="font-semibold text-slate-800">{currentUser.department}</div>
                    {currentUser.position && <div>{currentUser.position}</div>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block mb-0.5">E-mail cím</span>
                    <span className="font-bold text-slate-800">{currentUser.email}</span>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-medium block mb-0.5">Utolsó jelszómódosítás</span>
                    <span className="font-bold text-slate-800">
                      {currentUser.passwordChangedAt
                        ? new Date(currentUser.passwordChangedAt).toLocaleString('hu-HU')
                        : 'Még nem módosítva'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Password Change Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-2.5 text-slate-900 font-black text-base">
                    <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3>Jelszó Módosítása</h3>
                      <p className="text-xs font-normal text-slate-500 mt-0.5">
                        Itt tudod bármikor biztonságosan módosítani a belépési jelszavadat.
                      </p>
                    </div>
                  </div>
                </div>

                {passwordErrorMessage && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start space-x-3 text-red-900 text-xs">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Nem sikerült a jelszómódosítás</span>
                      <p>{passwordErrorMessage}</p>
                    </div>
                  </div>
                )}

                {passwordSuccessMessage && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start space-x-3 text-emerald-900 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">Sikeres művelet</span>
                      <p>{passwordSuccessMessage}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Jelenlegi jelszó *</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPasswordInput}
                      onChange={(e) => setCurrentPasswordInput(e.target.value)}
                      placeholder="Add meg a jelenleg használt jelszavadat"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                        <span>Új jelszó *</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Legalább 6 karakter"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Új jelszó megerősítése *</span>
                      </label>
                      <input
                        type="password"
                        required
                        value={confirmPasswordInput}
                        onChange={(e) => setConfirmPasswordInput(e.target.value)}
                        placeholder="Írd be újra az új jelszavadat"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-amber-400 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center space-x-2"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Clock className="w-4 h-4 animate-spin text-amber-400" />
                          <span>Mentés folyamatban...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Új jelszó mentése</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
              <div className="w-14 h-14 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/20">
                <Lock className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-black text-slate-900">Bejelentkezés szükséges</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A fiókadatok és a jelszómódosítás eléréséhez kérjük, jelentkezz be a rendszerbe a saját felhasználóneveddel!
                </p>
              </div>
              {onOpenLogin && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenLogin}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-sm inline-flex items-center space-x-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Bejelentkezési ablak megnyitása</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sent Email Viewer Modal */}
      {viewingEmailCopy && (
        <SentEmailViewerModal
          email={viewingEmailCopy}
          onClose={() => setViewingEmailCopy(null)}
        />
      )}
    </div>
  );
};
