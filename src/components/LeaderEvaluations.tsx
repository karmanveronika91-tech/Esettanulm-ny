import React, { useState, useMemo } from 'react';
import { Submission, CaseStudy, CustomerServicePillar } from '../types';
import {
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Eye,
  Trash2,
  User,
  Building,
  Mail,
  ChevronRight,
  TrendingUp,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { openMailClient, getPortalUrl } from '../services/notificationService';
import { ManagerReviewModal } from './ManagerReviewModal';

interface LeaderEvaluationsProps {
  submissions: Submission[];
  caseStudies?: CaseStudy[];
  customerStandards?: CustomerServicePillar[];
  departments?: string[];
  onUpdateSubmission: (submission: Submission) => void;
  onDeleteSubmission: (id: string) => void;
  onClearAllSubmissions: () => void;
}

export const LeaderEvaluations: React.FC<LeaderEvaluationsProps> = ({
  submissions,
  caseStudies,
  customerStandards,
  departments: propDepartments,
  onUpdateSubmission,
  onDeleteSubmission,
  onClearAllSubmissions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [submissionToDeleteId, setSubmissionToDeleteId] = useState<string | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.colleagueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.colleagueEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.caseStudyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.department.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && sub.status === 'pending_review') ||
      (statusFilter === 'approved' && sub.status === 'approved') ||
      (statusFilter === 'accepted' && sub.status === 'accepted') ||
      (statusFilter === 'redo' && (sub.status === 'redo_required' || sub.status === 'redo_requested'));

    const matchesDept = departmentFilter === 'all' || sub.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  // Get distinct departments
  const departments = useMemo(() => {
    const base = propDepartments && propDepartments.length > 0 ? propDepartments : [];
    const fromSubs = submissions.map((s) => s.department).filter(Boolean);
    return Array.from(new Set([...base, ...fromSubs]));
  }, [propDepartments, submissions]);

  const [lastNotifiedSub, setLastNotifiedSub] = useState<Submission | null>(null);
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState<Submission | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const pendingCount = submissions.filter((s) => s.status === 'pending_review').length;
  const approvedCount = submissions.filter((s) => s.status === 'approved' || s.status === 'accepted').length;

  const handleApproveAndNotify = (updated: Submission) => {
    onUpdateSubmission(updated);
    setSelectedSubmission(null);
    setLastNotifiedSub(updated);
  };

  const handleUpdateSubmissionFromModal = (updated: Submission) => {
    setSelectedSubmission(updated);
    onUpdateSubmission(updated);
  };

  return (
    <div className="space-y-6">
      {/* Sent Email Success Banner */}
      {lastNotifiedSub && (
        <div className="p-4 sm:p-5 bg-emerald-50 border-2 border-emerald-300 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-sm">
              <Mail className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <span className="bg-emerald-600 text-white text-[11px] font-black px-2 py-0.5 rounded">
                  E-mail kiküldve & Jóváhagyva
                </span>
                <span className="text-xs text-emerald-800 font-bold">
                  {lastNotifiedSub.colleagueName} ({lastNotifiedSub.colleagueEmail})
                </span>
              </div>
              <p className="text-xs text-emerald-950">
                A rendszer sikeresen elküldte a hivatalos értesítőt. A munkavállaló most már beléphet a portálra a jóváhagyott százalékok ({lastNotifiedSub.overallScore}%) megtekintéséhez és a döntés meghozatalához.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => setShowEmailPreviewModal(lastNotifiedSub)}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm flex items-center space-x-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Kiküldött E-mail Megtekintése</span>
            </button>
            <button
              onClick={() => setLastNotifiedSub(null)}
              className="p-1.5 text-emerald-800 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Stats Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-2.5 py-0.5 rounded-md border border-amber-200">
              Vezetői & HR Felület
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center space-x-2">
            <FileCheck className="w-6 h-6 text-amber-600" />
            <span>Értékelések & Jóváhagyások</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            A munkatársak által beküldött esettanulmányok, feladatmegoldások és tájékoztató levelek vezetői ellenőrzése.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-950 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Jóváhagyásra vár: {pendingCount} db</span>
          </div>

          {submissions.length > 0 && (
            showClearAllConfirm ? (
              <div className="flex items-center space-x-2 bg-red-50 p-1.5 rounded-xl border border-red-200 animate-in fade-in">
                <span className="text-xs font-bold text-red-900">Minden beküldést törölsz?</span>
                <button
                  type="button"
                  onClick={() => {
                    onClearAllSubmissions();
                    setShowClearAllConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
                >
                  Igen, mindet
                </button>
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
                >
                  Mégse
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Lista kiürítése
              </button>
            )
          )}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Keresés munkatárs neve, e-mailje vagy esettanulmány szerint..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 font-medium focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">Minden Státusz</option>
              <option value="pending">Jóváhagyásra vár ({pendingCount})</option>
              <option value="approved">Vezető által jóváhagyva</option>
              <option value="accepted">Munkavállaló elfogadta</option>
              <option value="redo">75% alatti / Újradolgozás</option>
            </select>
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="bg-transparent text-slate-700 font-bold focus:outline-none cursor-pointer"
              >
                <option value="all">Minden Részleg</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Submissions Table / Cards */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center text-slate-500 space-y-3">
          <FileCheck className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">Nincs megjeleníthető értékelési bejegyzés.</p>
          <p className="text-xs text-slate-400">
            A munkatársak által a portálon beküldött esettanulmányok itt fognak megjelenni.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Munkatárs & Részleg</th>
                  <th className="py-3.5 px-4">Esettanulmány</th>
                  <th className="py-3.5 px-4 text-center">1. Feladat</th>
                  <th className="py-3.5 px-4 text-center">2. Levél</th>
                  <th className="py-3.5 px-4 text-center">Összesített</th>
                  <th className="py-3.5 px-4">Státusz</th>
                  <th className="py-3.5 px-4 text-right">Művelet</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.map((sub) => {
                  const isPending = sub.status === 'pending_review';
                  const isRedo = sub.status === 'redo_required' || sub.status === 'redo_requested';

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSubmission(sub)}
                      className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                    >
                      {/* Colleague Details */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{sub.colleagueName}</div>
                        <div className="text-slate-500 text-[11px] flex items-center space-x-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{sub.colleagueEmail}</span>
                        </div>
                        <div className="text-amber-800 font-medium text-[10px] mt-0.5 bg-amber-50 px-2 py-0.5 rounded inline-block">
                          {sub.department}
                        </div>
                      </td>

                      {/* Case Study Title & Date */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 line-clamp-1">{sub.caseStudyTitle}</div>
                        <div className="text-slate-400 text-[11px] mt-0.5">
                          Beküldve: {new Date(sub.submittedAt).toLocaleString('hu-HU')}
                        </div>
                      </td>

                      {/* 1. Task Score */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block font-extrabold text-xs px-2.5 py-1 rounded-lg border ${
                            sub.taskScore >= 75
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {sub.taskScore}%
                        </span>
                      </td>

                      {/* 2. Email Score */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block font-extrabold text-xs px-2.5 py-1 rounded-lg border ${
                            sub.emailScore >= 75
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-red-50 text-red-800 border-red-200'
                          }`}
                        >
                          {sub.emailScore}%
                        </span>
                      </td>

                      {/* Overall Score */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-block font-black text-sm px-3 py-1 rounded-xl border ${
                            sub.overallScore >= 75
                              ? 'bg-amber-100 text-amber-950 border-amber-300'
                              : 'bg-red-100 text-red-950 border-red-300'
                          }`}
                        >
                          {sub.overallScore}%
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {sub.status === 'pending_review' && (
                          <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-200 inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            <span>Jóváhagyásra vár</span>
                          </span>
                        )}
                        {sub.status === 'approved' && (
                          <span className="bg-blue-100 text-blue-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-blue-200">
                            Vezető jóváhagyta
                          </span>
                        )}
                        {sub.status === 'accepted' && (
                          <span className="bg-emerald-100 text-emerald-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-200 inline-flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                            <span>Munkatárs elfogadta</span>
                          </span>
                        )}
                        {sub.status === 'redo_required' && (
                          <span className="bg-red-100 text-red-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-red-200">
                            75% alatt – Újradolgozandó
                          </span>
                        )}
                        {sub.status === 'redo_requested' && (
                          <span className="bg-orange-100 text-orange-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-orange-200">
                            Újradolgozást kért
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedSubmission(sub)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs inline-flex items-center space-x-1 cursor-pointer transition-all shadow-xs"
                          >
                            <span>{isPending ? 'Ellenőrzés & Jóváhagyás' : 'Részletek'}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                          </button>

                          {submissionToDeleteId === sub.id ? (
                            <div className="flex items-center space-x-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                              <span className="text-[11px] font-bold text-red-900 px-1">Törlöd?</span>
                              <button
                                type="button"
                                onClick={() => {
                                  onDeleteSubmission(sub.id);
                                  setSubmissionToDeleteId(null);
                                }}
                                className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded text-[11px] font-bold transition-all cursor-pointer shadow-xs"
                                title="Igen, beküldés törlése"
                              >
                                Igen
                              </button>
                              <button
                                type="button"
                                onClick={() => setSubmissionToDeleteId(null)}
                                className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] font-medium transition-all cursor-pointer"
                                title="Mégse"
                              >
                                Mégse
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setSubmissionToDeleteId(sub.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Beküldés törlése"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {selectedSubmission && (
        <ManagerReviewModal
          submission={selectedSubmission}
          caseStudies={caseStudies}
          customerStandards={customerStandards}
          onClose={() => setSelectedSubmission(null)}
          onApproveAndNotify={handleApproveAndNotify}
          onDeleteSubmission={onDeleteSubmission}
          onUpdateSubmission={handleUpdateSubmissionFromModal}
        />
      )}

      {/* Email Preview Modal */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kiküldött E-mail Értesítés Másolata</h3>
                  <span className="text-[11px] text-slate-400">Automatikus Értesítő Rendszer</span>
                </div>
              </div>

              <button
                onClick={() => setShowEmailPreviewModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex">
                  <span className="font-bold text-slate-500 w-20">Feladó:</span>
                  <span className="font-semibold text-slate-800">Esettanulmány Értékelő Rendszer &lt;noreply-ertekeles@ceg.hu&gt;</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-slate-500 w-20">Címzett:</span>
                  <span className="font-bold text-amber-900">{showEmailPreviewModal.colleagueName} &lt;{showEmailPreviewModal.colleagueEmail}&gt;</span>
                </div>
                <div className="flex">
                  <span className="font-bold text-slate-500 w-20">Tárgy:</span>
                  <span className="font-bold text-slate-900">
                    [Értékelés] Esettanulmány Értékelés elkészült - Döntés szükséges ({showEmailPreviewModal.caseStudyTitle})
                  </span>
                </div>
                <div className="flex">
                  <span className="font-bold text-slate-500 w-20">Időpont:</span>
                  <span className="text-slate-600">{new Date(showEmailPreviewModal.reviewedAt || Date.now()).toLocaleString('hu-HU')}</span>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl font-mono text-slate-800 whitespace-pre-line leading-relaxed max-h-72 overflow-y-auto">
                {showEmailPreviewModal.notificationMessage ||
                  `Kedves ${showEmailPreviewModal.colleagueName}!

Tájékoztatunk, hogy a(z) "${showEmailPreviewModal.caseStudyTitle}" témájú esettanulmány feladatmegoldásod és partneri tájékoztató leveled minőségbiztosítási ellenőrzése és felülvizsgálata lezárult.

Elért pontszámok:
- 1. Feladatkidolgozás: ${showEmailPreviewModal.taskScore}%
- 2. Tájékoztató Levél: ${showEmailPreviewModal.emailScore}%
- Súlyozott Összeredmény: ${showEmailPreviewModal.overallScore}%

A RÉSZLETES ÉRTÉKELÉS ELÉRÉSE:
Kattints az alábbi linkre a portál közvetlen megnyitásához:
👉 ${getPortalUrl()}

${
  showEmailPreviewModal.overallScore < 75
    ? '⚠️ MINŐSÍTÉS: Az elért eredmény 75% alatti, így a minőségbiztosítási szabályzat alapján automatikusan nem került elfogadásra. Kérjük, lépj be a fenti linken az Esettanulmány Portálra, tekintsd át a részletes szakmai és kommunikációs elemzést a javításhoz.'
    : '✅ MINŐSÍTÉS: Az értékelésed elérte a megfelelt szintet! Kérjük, lépj be a fenti linken a felületre, tekintsd át a részletes szöveges elemzést, és kattints az elfogadásra vagy az esetleges újra dolgozásra.'
}

Üdvözlettel:
Esettanulmányok — Minőségbiztosítási Rendszer`}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    const text = showEmailPreviewModal.notificationMessage || '';
                    navigator.clipboard.writeText(text);
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Másolva!' : 'Szöveg Másolása'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const subj = `[Értékelés] Esettanulmány Értékelés elkészült - Döntés szükséges (${showEmailPreviewModal.caseStudyTitle})`;
                    const body = showEmailPreviewModal.notificationMessage || '';
                    openMailClient({
                      to: showEmailPreviewModal.colleagueEmail,
                      cc: 'karman.veronika91@gmail.com',
                      subject: subj,
                      body,
                    });
                  }}
                  className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Megnyitás Levelezőben</span>
                </button>
              </div>

              <button
                onClick={() => setShowEmailPreviewModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
