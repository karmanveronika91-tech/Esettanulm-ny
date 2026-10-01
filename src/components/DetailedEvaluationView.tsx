import React, { useState } from 'react';
import { Submission, CaseStudy, CustomerServicePillar } from '../types';
import { PannonJobLogo } from './PannonJobLogo';
import { StructuredFeedbackRenderer, stripIntroductionText } from './StructuredFeedbackRenderer';
import { StructuredEmailReviewSection } from './StructuredEmailReviewSection';
import {
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Printer,
  ChevronLeft,
  Copy,
  Check,
  Building,
  User,
  Calendar,
  RefreshCw,
  ShieldCheck,
  Clock,
  AlertTriangle,
  XCircle,
  MessageSquare,
  ShieldAlert,
  ArrowRight,
  ThumbsUp,
  Target,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface DetailedEvaluationViewProps {
  submission: Submission;
  caseStudies?: CaseStudy[];
  customerStandards?: CustomerServicePillar[];
  onBack: () => void;
  onEmployeeDecision?: (submissionId: string, decision: 'accepted' | 'redo') => void;
  isManagerView?: boolean;
}

export const DetailedEvaluationView: React.FC<DetailedEvaluationViewProps> = ({
  submission,
  caseStudies,
  customerStandards,
  onBack,
  onEmployeeDecision,
  isManagerView = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'task' | 'email'>('overview');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const currentCase = caseStudies?.find(
    (c) =>
      c.id === submission.caseStudyId ||
      c.title.toLowerCase().trim() === submission.caseStudyTitle.toLowerCase().trim()
  );
  const sampleEmailTemplate = currentCase?.sampleEmailTemplate || (currentCase as any)?.sampleEmail;

  const isBelowThreshold =
    submission.overallScore < 75 || submission.taskScore < 75 || submission.emailScore < 75;

  // Guard: If employee tries to open a pending submission, show the friendly pending screen without revealing scores
  if (!isManagerView && submission.status === 'pending_review') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Vissza a listához</span>
          </button>
        </div>

        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Clock className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-200 inline-block">
              Vezetői Értékelésre és Jóváhagyásra Vár
            </span>
            <h2 className="text-2xl font-bold text-slate-900">{submission.caseStudyTitle}</h2>
            <p className="text-sm text-slate-500">
              Beküldte: <span className="font-semibold text-slate-800">{submission.colleagueName}</span> ({submission.department})
            </p>
          </div>

          <div className="p-5 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs sm:text-sm text-slate-700 text-left space-y-2 leading-relaxed">
            <p className="font-bold text-slate-900 flex items-center space-x-2">
              <Mail className="w-4 h-4 text-amber-600" />
              <span>Automatikus E-mail Értesítés Jóváhagyáskor</span>
            </p>
            <p>
              A benyújtott feladatmegoldás és a tájékoztató levél a szakmai folyamatnak megfelelően a vezetőd / HR értékelőd felülvizsgálati sorában van.
            </p>
            <p>
              Amint a vezető ellenőrizte és jóváhagyta a kiértékelést, a rendszer automatikus e-mail értesítést küld a megadott e-mail címedre (<span className="font-bold text-slate-900">{submission.colleagueEmail}</span>). Ezt követően belépve megtekintheted a százalékokat, a részletes szöveges javításokat és meghozhatod az elfogadási döntést.
            </p>
          </div>

          <button
            onClick={onBack}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md"
          >
            Visszatérés a Saját Értékeléseimhez
          </button>
        </div>
      </div>
    );
  }

  const handleCopyEmail = () => {
    if (!submission.emailEvaluation?.suggestedEmail) return;
    navigator.clipboard.writeText(submission.emailEvaluation.suggestedEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Vissza a listához</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Nyomtatás / PDF</span>
          </button>
        </div>
      </div>

      {/* Hero Result Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-4 ${
          isBelowThreshold
            ? 'bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 border border-red-800/40'
            : 'bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 border border-amber-500/20'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <PannonJobLogo variant="light" size="sm" showSubtitle={false} />
              <span className="bg-amber-400 text-slate-950 text-xs font-extrabold px-3 py-1 rounded-md">
                Esettanulmány Kiértékelési Jelentés
              </span>
              <span className="bg-white/10 text-white text-xs px-2.5 py-1 rounded-md">
                {submission.department}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold">{submission.colleagueName}</h1>
            <p className="text-sm text-slate-300">
              Esettanulmány: <strong className="text-amber-300">{submission.caseStudyTitle}</strong>
            </p>
          </div>

          {/* Scores Overview Pill */}
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 self-start md:self-auto">
            <div className="text-center px-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">1. Feladat</span>
              <span
                className={`text-2xl font-black ${
                  submission.taskScore >= 75 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {submission.taskScore}%
              </span>
            </div>

            <div className="w-px h-8 bg-white/20"></div>

            <div className="text-center px-2">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">2. Levél</span>
              {isManagerView ? (
                <span
                  className={`text-2xl font-black ${
                    submission.emailScore >= 75 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {submission.emailScore}%
                </span>
              ) : (
                <span
                  className={`text-xl sm:text-2xl font-black ${
                    submission.emailScore >= 75 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {submission.emailScore >= 75 ? 'Sikeres' : 'Sikertelen'}
                </span>
              )}
            </div>

            <div className="w-px h-8 bg-white/20"></div>

            <div className="text-center px-2">
              <span className="text-[10px] uppercase tracking-wider text-amber-300 block font-bold">Összesített</span>
              <span
                className={`text-2xl font-black ${
                  submission.overallScore >= 75 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {submission.overallScore}%
              </span>
            </div>
          </div>
        </div>

        {/* 75% Rule Notification */}
        {isBelowThreshold ? (
          <div className="p-3.5 bg-red-900/60 border border-red-500/50 rounded-xl text-xs text-red-200 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>
              <strong>Figyelem:</strong> Az elért eredmény nem éri el a 75%-os küszöböt. A szabályzat alapján az értékelés nem fogadható el, mind a feladatkidolgozás, mind a tájékoztató levél újbóli elkészítése kötelező.
            </span>
          </div>
        ) : (
          <div className="p-3.5 bg-emerald-900/40 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              <strong>Sikeres teljesítés:</strong> Az eredmény meghaladja a 75%-ot. A munkatárs elfogadhatja az értékelést vagy újradolgozást kérhet.
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white p-2 rounded-2xl shadow-sm gap-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'overview' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Átfogó Értékelés & Összegzés</span>
        </button>
        <button
          onClick={() => setActiveTab('task')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'task' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>1. Feladatkidolgozás ({submission.taskScore}%)</span>
        </button>
        <button
          onClick={() => setActiveTab('email')}
          className={`px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'email' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>2. Tájékoztató Levél & Standardok {isManagerView ? `(${submission.emailScore}%)` : `(${submission.emailScore >= 75 ? 'Sikeres' : 'Sikertelen'})`}</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Mismatched / Zero Score Alert Banner if applicable */}
          {(submission.overallScore === 0 || submission.taskScore === 0) && (
            <div className="bg-red-50 border-2 border-red-500/80 rounded-2xl p-5 shadow-sm space-y-2">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="w-6 h-6 text-red-600 flex-shrink-0" />
                <h3 className="font-extrabold text-red-950 text-base">
                  Szigorú Értékelési Szabály Érvényesítve: Kötelező 0% Pontszám
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-red-900 leading-relaxed font-medium">
                A rendszer értékelése szerint a beküldött munka vagy nem a kijelölt esettanulmány kérdéseire válaszol (más esetet dolgozott ki), vagy irreleváns tartalmat tartalmaz. A szakmai szabályzat értelmében ilyen esetben az értékelés kötelezően 0%, és az esettanulmány teljes újbóli kidolgozása szükséges.
              </p>
            </div>
          )}

          {/* 10. Összegzés a végén: Overall Evaluation Summary */}
          {submission.overallSummary && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-amber-600" />
                    <h3 className="text-lg font-bold text-slate-900">
                      Részletes Szakmai Összegzés & Jövőbeli Tanulságok
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Átfogó szakmai visszajelzés a feladat és a levél együttes minősítéséről
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                    {submission.overallSummary.overallTone || 'Strukturált Szakmai Értékelés'}
                  </span>
                </div>
              </div>

              {/* Final Verdict / Átfogó értékelői megállapítás */}
              {(submission.overallSummary.finalVerdict || (submission.overallSummary as any).generalAssessment) && (
                <div className="space-y-2">
                  <strong className="text-slate-900 block font-bold flex items-center space-x-1.5 text-xs sm:text-sm">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    <span>Átfogó Értékelői Megállapítás:</span>
                  </strong>
                  <StructuredFeedbackRenderer
                    content={submission.overallSummary.finalVerdict || (submission.overallSummary as any).generalAssessment}
                    defaultTitle="Szakmai Értékelői Megállapítás"
                  />
                </div>
              )}

              {/* Strengths and Improvements Grid (Zöld és Piros) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 🟢 Megerősítendő főbb erősségek */}
                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <ThumbsUp className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wide">
                      🟢 Megerősítendő Főbb Erősségek:
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-emerald-950">
                    {(submission.overallSummary.mainStrengths || (submission.overallSummary as any).keyPositivePoints || []).map((str: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 🔴 Legfontosabb fejlesztendő területek */}
                <div className="p-4 bg-red-50/80 rounded-xl border border-red-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <h4 className="font-bold text-red-950 text-xs uppercase tracking-wide">
                      🔴 Legfontosabb Fejlesztendő Területek:
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-red-950">
                    {(submission.overallSummary.mainAreasForImprovement || (submission.overallSummary as any).keyImprovementPoints || []).map((imp: string, idx: number) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-red-600 font-bold">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 🎯 2-3 Konkrét tanulság a jövőre nézve */}
              {(submission.overallSummary.keyLearningsForFuture || (submission.overallSummary as any).keyTakeaways) &&
                ((submission.overallSummary.keyLearningsForFuture || (submission.overallSummary as any).keyTakeaways).length > 0) && (
                  <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 space-y-2.5">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-amber-600" />
                      <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wide">
                        🎯 Konkrét Tanulságok és Iránymutatások a Jövőre Nézve:
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
                      {(submission.overallSummary.keyLearningsForFuture || (submission.overallSummary as any).keyTakeaways).map((learning: string, idx: number) => (
                        <div
                          key={idx}
                          className="p-3 bg-white/90 rounded-lg border border-amber-200/80 text-xs text-slate-800 shadow-2xs space-y-1"
                        >
                          <span className="font-black text-amber-700 block text-[11px]">
                            {idx + 1}. Tanulság
                          </span>
                          <p className="leading-relaxed">{learning}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Manager notes if available */}
          {submission.managerNotes && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-xs text-blue-950 space-y-1">
              <span className="font-bold block text-sm">
                👔 Vezetői Visszajelzés ({submission.reviewedBy || 'Vezető / HR Értékelő'}):
              </span>
              <p className="leading-relaxed">{submission.managerNotes}</p>
            </div>
          )}

          {/* Constructive feedback for employee */}
          {submission.emailEvaluation?.feedbackForEmployee && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>Fejlesztő Visszajelzés a Munkatárs Részére</span>
                </h3>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  Strukturált szakmai coaching
                </span>
              </div>
              <StructuredFeedbackRenderer
                content={submission.emailEvaluation.feedbackForEmployee}
                defaultTitle="Részletes Fejlesztő Visszajelzés"
              />
            </div>
          )}

          {/* Side by side summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Task summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>1. Feladatkidolgozás Összegzés</span>
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    submission.taskScore >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {submission.taskScore}%
                </span>
              </div>
              <StructuredFeedbackRenderer
                content={submission.taskEvaluation?.summaryFeedback || ''}
                defaultTitle="Feladatkidolgozás összefoglalása"
              />
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs">
                <strong className="text-amber-950 block mb-0.5">Jogszabály & Nyomtatvány ellenőrzés:</strong>
                <span className="text-slate-800">{submission.taskEvaluation?.legalAndProcedureCheck}</span>
              </div>
            </div>

            {/* Email summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>2. Tájékoztató Levél Összegzés</span>
                </h3>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded-md ${
                    submission.emailScore >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {isManagerView
                    ? `${submission.emailScore}%`
                    : submission.emailScore >= 75
                    ? 'Sikeres'
                    : 'Sikertelen'}
                </span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {submission.emailEvaluation?.communicationTone}
              </p>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs">
                <strong className="text-blue-950 block mb-0.5">Proaktivitás és Határidők:</strong>
                <span className="text-slate-800">{submission.emailEvaluation?.proactivityCheck}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASK DETAIL */}
      {activeTab === 'task' && (
        <div className="space-y-6 text-xs sm:text-sm">
          {/* Tételes pontlevonási indoklás kártya (Feladat) */}
          {(submission.taskScore < 100 ||
            (submission.taskEvaluation?.deductions && submission.taskEvaluation.deductions.length > 0) ||
            submission.taskEvaluation?.deductionExplanation) && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                <h4 className="font-bold text-amber-950 text-sm flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Tételes Pontlevonások és Szakmai Indoklásuk (Kezdőpontszám: 100% → Végeredmény: {submission.taskScore}%)</span>
                </h4>
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-200/80 text-amber-900 self-start sm:self-auto">
                  Összes levont pont: -{100 - submission.taskScore}%
                </span>
              </div>
              {submission.taskEvaluation?.deductionExplanation && (
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {submission.taskEvaluation.deductionExplanation}
                </p>
              )}
              {submission.taskEvaluation?.deductions && submission.taskEvaluation.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                    Tételes levonási jegyzék:
                  </span>
                  {submission.taskEvaluation.deductions.map((d, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white/95 rounded-xl border border-amber-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block font-bold">{d.item}</strong>
                        <span className="text-slate-700 leading-relaxed">{d.reason}</span>
                      </div>
                      <span className="font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs flex-shrink-0 self-start sm:self-auto">
                        -{d.pointsDeducted}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Question by question breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Kérdésenkénti Szakmai Elemzés</h3>
              <span className="text-xs text-slate-500 font-semibold">
                Szakmai megoldási kulcs és 10-es pontozási skála alapján
              </span>
            </div>

            <div className="space-y-6">
              {submission.taskEvaluation?.questionEvaluations?.map((q, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    q.isUnanswered
                      ? 'bg-red-50/80 border-2 border-red-500/80 shadow-xs'
                      : q.isCorrect
                      ? 'bg-slate-50/60 border-slate-200'
                      : 'bg-red-50/30 border-red-200'
                  }`}
                >
                  {/* Warning if unanswered */}
                  {q.isUnanswered && (
                    <div className="mb-3 p-3 bg-red-600 text-white rounded-xl text-xs font-bold flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                      <span>⚠️ Megválaszolatlan kérdés (0 pont) – Nem került kidolgozásra!</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                        {q.questionNumber}. Kérdés: {q.questionText}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2 self-start sm:self-auto flex-shrink-0">
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-lg border ${
                          (q.score ?? 0) >= 75
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : (q.score ?? 0) >= 50
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-red-100 text-red-900 border-red-300'
                        }`}
                      >
                        {q.scoreOutOf10 !== undefined ? `${q.scoreOutOf10}/10 pont` : `${Math.round((q.score ?? 0) / 10)}/10 pont`} • {q.score ?? 0}%
                      </span>
                    </div>
                  </div>

                  {/* Beküldött válasz és Elvárt megoldás */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">
                        A kolléga által beküldött válasz:
                      </span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {q.employeeAnswerSummary || 'Nem adott érdemi választ.'}
                      </p>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-amber-200/90 space-y-1">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        Elvárt szakmai helyes válasz:
                      </span>
                      <p className="text-slate-800 leading-relaxed whitespace-pre-line">
                        {q.correctSolutionExpected}
                      </p>
                    </div>
                  </div>

                  {/* 🟢 Pozitívumok és 🔴 Fejlesztendő pontok a kérdésnél */}
                  {((q.positivePoints && q.positivePoints.length > 0) ||
                    (q.improvementPoints && q.improvementPoints.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 text-xs">
                      {/* 🟢 Pozitívumok */}
                      {q.positivePoints && q.positivePoints.length > 0 && (
                        <div className="p-3 bg-emerald-50/90 rounded-xl border border-emerald-200 space-y-1">
                          <span className="font-bold text-emerald-950 block flex items-center space-x-1.5 uppercase text-[11px]">
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                            <span>🟢 Szakmailag helyes elemek:</span>
                          </span>
                          <ul className="space-y-1 text-emerald-950">
                            {q.positivePoints.map((pt, i) => (
                              <li key={i} className="flex items-start space-x-1.5">
                                <span className="text-emerald-600 font-bold">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 🔴 Fejlesztendő pontok */}
                      {q.improvementPoints && q.improvementPoints.length > 0 && (
                        <div className="p-3 bg-red-50/90 rounded-xl border border-red-200 space-y-1">
                          <span className="font-bold text-red-950 block flex items-center space-x-1.5 uppercase text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                            <span>🔴 Hiányos vagy pontatlan elemek:</span>
                          </span>
                          <ul className="space-y-1 text-red-950">
                            {q.improvementPoints.map((pt, i) => (
                              <li key={i} className="flex items-start space-x-1.5">
                                <span className="text-red-600 font-bold">•</span>
                                <span>{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Részletes szakmai indoklás */}
                  {q.detailedReasoning && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
                      <strong className="text-slate-900 block mb-0.5 font-bold">
                        Részletes szakmai indoklás:
                      </strong>
                      <p>{stripIntroductionText(q.detailedReasoning)}</p>
                    </div>
                  )}

                  {/* Javasolt megközelítés / etalon válasz */}
                  {q.suggestedApproach && (
                    <div className="mt-3 p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                      <span className="font-bold flex items-center space-x-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        <span>Javasolt szakmai megközelítés és helyes megfogalmazás:</span>
                      </span>
                      <p className="font-mono text-[11px] leading-relaxed pl-5">{stripIntroductionText(q.suggestedApproach)}</p>
                    </div>
                  )}

                  {/* Kérdés szintű pontlevonási indoklás */}
                  {(q.score ?? 0) < 100 && (
                    <div className="mt-3 p-3 bg-amber-50/90 rounded-xl border border-amber-200 text-xs flex items-start space-x-2.5">
                      <span className="font-black text-red-700 bg-red-100/90 border border-red-200 px-2 py-0.5 rounded text-[11px] flex-shrink-0 mt-0.5">
                        Levonás: -{100 - (q.score ?? 0)}%
                      </span>
                      <div className="leading-relaxed">
                        <strong className="text-amber-950 font-bold block mb-0.5">
                          Pontlevonás szakmai indoklása:
                        </strong>
                        <span className="text-slate-800">
                          {stripIntroductionText(
                            q.scoreDeductionReason ||
                              q.feedback ||
                              'A válasz nem tartalmazta a belső szabályzatban előírt minden kötelező szakmai elemet vagy határidőt.'
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="mt-2.5 text-xs text-slate-700 font-medium">
                    <strong>Értékelői megjegyzés:</strong> {stripIntroductionText(q.feedback || '')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Correct & Missing Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Helyesen Kifejtett Szakmai Elemek</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {submission.taskEvaluation?.correctPoints?.map((pt, i) => (
                  <li key={i} className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-950">
                    • {pt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
              <h4 className="font-bold text-red-950 text-sm flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Fejlesztendő Szempontok & Pótolandó Ismeretek</span>
              </h4>
              <ul className="space-y-2 text-xs">
                {submission.taskEvaluation?.missingPoints?.map((pt, i) => (
                  <li key={i} className="p-2.5 bg-red-50 rounded-xl border border-red-100 text-red-950">
                    • {pt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EMAIL DETAIL */}
      {activeTab === 'email' && submission.emailEvaluation && (
        <div className="space-y-6">
          {/* Tételes pontlevonási indoklás kártya (Levél) - csak vezetői felületen */}
          {isManagerView &&
            (submission.emailScore < 100 ||
              (submission.emailEvaluation?.deductions && submission.emailEvaluation.deductions.length > 0) ||
              submission.emailEvaluation?.deductionExplanation) && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-3xl p-6 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
                <h4 className="font-bold text-amber-950 text-sm flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Tételes Pontlevonások és Szakmai Indoklásuk (Kezdőpontszám: 100% → Végeredmény: {submission.emailScore}%)</span>
                </h4>
                <span className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-200/80 text-amber-900 self-start sm:self-auto">
                  Összes levont pont: -{100 - submission.emailScore}%
                </span>
              </div>
              {submission.emailEvaluation?.deductionExplanation && (
                <p className="text-xs text-amber-950 leading-relaxed font-medium">
                  {submission.emailEvaluation.deductionExplanation}
                </p>
              )}
              {submission.emailEvaluation?.deductions && submission.emailEvaluation.deductions.length > 0 && (
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wide block">
                    Tételes levonási jegyzék:
                  </span>
                  {submission.emailEvaluation.deductions.map((d, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white/95 rounded-xl border border-amber-200/70 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <strong className="text-slate-900 block font-bold">{d.item}</strong>
                        <span className="text-slate-700 leading-relaxed">{d.reason}</span>
                      </div>
                      <span className="font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md text-xs flex-shrink-0 self-start sm:self-auto">
                        -{d.pointsDeducted}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Kötelező 6 pontos szabványosított értékelés a betáplált standardok alapján */}
          <StructuredEmailReviewSection
            emailEvaluation={submission.emailEvaluation}
            submittedEmailContent={submission.emailContent}
            emailDocFileName={submission.emailDocFileName}
            sampleEmailTemplate={sampleEmailTemplate}
            customerStandards={customerStandards}
            isReviewMode={isManagerView}
          />
        </div>
      )}

      {/* Decision Footer for Employee */}
      {!isManagerView && onEmployeeDecision && submission.status === 'approved' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <span className="font-bold text-slate-900 block text-sm">Végleges döntés az értékelésről</span>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBelowThreshold
                ? 'Mivel az elért pontszám nem érte el a 75%-ot, a feladatot kötelező újra elkészítened.'
                : 'Elfogadod a vezető által jóváhagyott értékelést, vagy szeretnél javítani az eredményen?'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {isBelowThreshold ? (
              <button
                onClick={() => onEmployeeDecision(submission.id, 'redo')}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
              >
                Kötelező Újradolgozás Megkezdése
              </button>
            ) : (
              <>
                <button
                  onClick={() => onEmployeeDecision(submission.id, 'redo')}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Nem fogadom el, újra elkészítem
                </button>

                <button
                  onClick={() => onEmployeeDecision(submission.id, 'accepted')}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Elfogadom az Értékelést
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
