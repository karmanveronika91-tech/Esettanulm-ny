import React, { useState } from 'react';
import {
  Submission,
  QuestionEvaluation,
  PillarFeedback,
  CaseStudy,
  CustomerServicePillar,
  EmailEvaluation,
  TaskEvaluation,
} from '../types';
import { sendManagerReviewEmail, openMailClient, getPortalUrl } from '../services/notificationService';
import { StructuredEmailReviewSection } from './StructuredEmailReviewSection';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileText,
  Mail,
  ShieldCheck,
  Send,
  Edit3,
  Sparkles,
  User,
  Calendar,
  Building,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  BookOpen,
  Sliders,
} from 'lucide-react';

interface ManagerReviewModalProps {
  submission: Submission;
  onClose: () => void;
  onApproveAndNotify: (updatedSubmission: Submission) => void;
  onDeleteSubmission: (id: string) => void;
  caseStudies?: CaseStudy[];
  customerStandards?: CustomerServicePillar[];
  onUpdateSubmission?: (updatedSubmission: Submission) => void;
}

export const ManagerReviewModal: React.FC<ManagerReviewModalProps> = ({
  submission,
  onClose,
  onApproveAndNotify,
  onDeleteSubmission,
  caseStudies,
  customerStandards,
  onUpdateSubmission,
}) => {
  const [managerName, setManagerName] = useState(submission.reviewedBy || 'Vezető / HR Értékelő');
  const [managerNotes, setManagerNotes] = useState(submission.managerNotes || '');

  // Modifiable scores by Manager
  const [taskScore, setTaskScore] = useState<number>(submission.taskScore);
  const [emailScore, setEmailScore] = useState<number>(submission.emailScore);
  const [isEditingMode, setIsEditingMode] = useState(false);

  // Deep evaluations state
  const [taskEvaluation, setTaskEvaluation] = useState<TaskEvaluation | undefined>(
    submission.taskEvaluation
  );
  const [emailEvaluation, setEmailEvaluation] = useState<EmailEvaluation | undefined>(
    submission.emailEvaluation
  );

  // Editable deep evaluation states
  const [questionEvals, setQuestionEvals] = useState<QuestionEvaluation[]>(
    submission.taskEvaluation?.questionEvaluations || []
  );
  const [taskSummary, setTaskSummary] = useState(submission.taskEvaluation?.summaryFeedback || '');
  const [legalCheck, setLegalCheck] = useState(submission.taskEvaluation?.legalAndProcedureCheck || '');
  const [correctPoints, setCorrectPoints] = useState<string[]>(submission.taskEvaluation?.correctPoints || []);
  const [missingPoints, setMissingPoints] = useState<string[]>(submission.taskEvaluation?.missingPoints || []);

  const [pillarEvals, setPillarEvals] = useState<PillarFeedback[]>(
    submission.emailEvaluation?.pillarFeedback || []
  );
  const [commTone, setCommTone] = useState(submission.emailEvaluation?.communicationTone || '');
  const [proactivity, setProactivity] = useState(submission.emailEvaluation?.proactivityCheck || '');
  const [suggestedEmail, setSuggestedEmail] = useState(submission.emailEvaluation?.suggestedEmail || '');
  const [employeeFeedback, setEmployeeFeedback] = useState(submission.emailEvaluation?.feedbackForEmployee || '');

  // AI Re-evaluation states
  const [isReevaluating, setIsReevaluating] = useState(false);
  const [reevalSuccess, setReevalSuccess] = useState<string | null>(null);
  const [reevalError, setReevalError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Active inner tab in modal
  const [activeTab, setActiveTab] = useState<'overview' | 'task_detail' | 'email_detail'>('overview');
  // Sub-view inside email tab
  const [emailViewMode, setEmailViewMode] = useState<'structured' | 'edit_pillars'>('structured');

  const currentCase = caseStudies?.find(
    (c) =>
      c.id === submission.caseStudyId ||
      c.title.toLowerCase().trim() === submission.caseStudyTitle.toLowerCase().trim()
  );
  const sampleEmailTemplate = currentCase?.sampleEmailTemplate || (currentCase as any)?.sampleEmail;

  const calculatedOverallScore = Math.round((Number(taskScore) + Number(emailScore)) / 2);
  const isBelowThreshold = calculatedOverallScore < 75 || taskScore < 75 || emailScore < 75;

  // Handle re-evaluation using the latest customer-service prompt
  const handleReevaluateWithAIPrompt = async () => {
    if (isReevaluating) return;
    setIsReevaluating(true);
    setReevalError(null);
    setReevalSuccess(null);

    try {
      let targetCase = caseStudies?.find(
        (c) =>
          c.id === submission.caseStudyId ||
          c.title.toLowerCase().trim() === submission.caseStudyTitle.toLowerCase().trim()
      );

      if (!targetCase && caseStudies && caseStudies.length > 0) {
        targetCase = caseStudies[0];
      }

      if (!targetCase) {
        targetCase = {
          id: submission.caseStudyId || 'case-1',
          title: submission.caseStudyTitle || 'Esettanulmány',
          category: 'HR / Relokáció',
          description: submission.caseStudyTitle,
          questions: [],
          scoringCriteria: [],
          correctSolutionSummary: '',
          legalReferences: '',
          sampleEmail: '',
          sampleEmailTemplate: '',
          createdAt: new Date().toISOString(),
        };
      }

      const response = await fetch('/api/evaluate-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseStudy: targetCase,
          taskContent: submission.taskContent,
          emailContent: submission.emailContent,
          customerStandards: customerStandards || [],
          colleagueName: submission.colleagueName,
          colleagueEmail: submission.colleagueEmail,
          department: submission.department,
        }),
      });

      const responseText = await response.text();
      let resultPayload: any;
      try {
        resultPayload = JSON.parse(responseText);
      } catch {
        throw new Error(`A szerver nem adott érvényes választ (${response.status}).`);
      }

      if (!response.ok || !resultPayload.success) {
        throw new Error(resultPayload?.error || 'A kiértékelés sikertelen volt.');
      }

      const evalData = resultPayload.data;
      const newTaskScore = evalData.taskScore ?? evalData.taskEvaluation?.score ?? taskScore;
      const newEmailScore = evalData.emailScore ?? evalData.emailEvaluation?.score ?? emailScore;
      const newOverallScore = evalData.overallScore ?? Math.round((newTaskScore + newEmailScore) / 2);

      setTaskScore(newTaskScore);
      setEmailScore(newEmailScore);
      setEmailEvaluation(evalData.emailEvaluation);
      setTaskEvaluation(evalData.taskEvaluation);

      if (evalData.taskEvaluation?.questionEvaluations) {
        setQuestionEvals(evalData.taskEvaluation.questionEvaluations);
      }
      if (evalData.taskEvaluation?.summaryFeedback) {
        setTaskSummary(evalData.taskEvaluation.summaryFeedback);
      }
      if (evalData.taskEvaluation?.legalAndProcedureCheck) {
        setLegalCheck(evalData.taskEvaluation.legalAndProcedureCheck);
      }
      if (evalData.taskEvaluation?.correctPoints) {
        setCorrectPoints(evalData.taskEvaluation.correctPoints);
      }
      if (evalData.taskEvaluation?.missingPoints) {
        setMissingPoints(evalData.taskEvaluation.missingPoints);
      }

      if (evalData.emailEvaluation?.pillarFeedback) {
        setPillarEvals(evalData.emailEvaluation.pillarFeedback);
      }
      if (evalData.emailEvaluation?.communicationTone) {
        setCommTone(evalData.emailEvaluation.communicationTone);
      }
      if (evalData.emailEvaluation?.proactivityCheck) {
        setProactivity(evalData.emailEvaluation.proactivityCheck);
      }
      if (evalData.emailEvaluation?.suggestedEmail) {
        setSuggestedEmail(evalData.emailEvaluation.suggestedEmail);
      }
      if (evalData.emailEvaluation?.feedbackForEmployee) {
        setEmployeeFeedback(evalData.emailEvaluation.feedbackForEmployee);
      }

      // Automatically update parent & persistence
      const updatedSub: Submission = {
        ...submission,
        taskScore: newTaskScore,
        emailScore: newEmailScore,
        overallScore: newOverallScore,
        taskEvaluation: evalData.taskEvaluation,
        emailEvaluation: evalData.emailEvaluation,
      };

      if (onUpdateSubmission) {
        onUpdateSubmission(updatedSub);
      }

      setReevalSuccess('✅ Sikeres AI újraértékelés! A levél részletes vezetői elemzése, standardjai és mátrixa elkészült.');
      setActiveTab('email_detail');
      setEmailViewMode('structured');
    } catch (err: any) {
      console.error('Re-evaluation error:', err);
      setReevalError(err.message || 'Nem sikerült az újraértékelés.');
    } finally {
      setIsReevaluating(false);
    }
  };

  // Recalculate average task score from questions
  const handleUpdateQuestionScore = (index: number, newScore: number) => {
    const updated = [...questionEvals];
    const clamped = Math.max(0, Math.min(100, newScore));
    updated[index] = {
      ...updated[index],
      score: clamped,
      scoreOutOf10: Math.round(clamped / 10),
      isCorrect: clamped >= 75,
    };
    setQuestionEvals(updated);

    // Auto-recalc taskScore
    if (updated.length > 0) {
      const all100 = updated.every((q) => Number(q.score) === 100);
      const avg = Math.round(updated.reduce((sum, q) => sum + Number(q.score), 0) / updated.length);
      setTaskScore(all100 ? 100 : avg);
    }
  };

  // Recalculate average email score from pillars
  const handleUpdatePillarScore = (index: number, newScore: number) => {
    const updated = [...pillarEvals];
    updated[index] = {
      ...updated[index],
      score: newScore,
      isSatisfied: newScore >= 75,
    };
    setPillarEvals(updated);

    // Auto-recalc emailScore
    if (updated.length > 0) {
      const avg = Math.round(updated.reduce((sum, p) => sum + Number(p.score), 0) / updated.length);
      setEmailScore(avg);
    }
  };

  const isAlreadyApproved = submission.status !== 'pending_review' || !!submission.notificationSent;

  const handleApprove = () => {
    const updatedStatus = isBelowThreshold ? 'redo_required' : 'approved';
    const portalUrl = getPortalUrl();
    const notificationText = `Kedves ${submission.colleagueName}!

Tájékoztatunk, hogy a(z) "${submission.caseStudyTitle}" témájú esettanulmányod részletes szakmai és minőségbiztosítási felülvizsgálata lezárult.

HIVATALOS MINŐSÍTÉS:
=========================================
• Összesített pontszám: ${calculatedOverallScore}% ${isBelowThreshold ? '(Újradolgozást igényel)' : '(Megfelelt)'}
• 1. Feladatkidolgozás: ${taskScore}%
• 2. Tájékoztató levél: ${emailScore >= 75 ? 'Sikeres' : 'Sikertelen'}

SZÖVEGES SZAKMAI VISSZAJELZÉS:
-----------------------------------------
1. Feladatkidolgozás és jogi minősítés:
${taskSummary || 'Szakmailag áttekintve, a jogszabályi hivatkozások rendben vannak.'}

2. Tájékoztató levél és ügyfélszolgálati kommunikáció:
${employeeFeedback || commTone || 'A partneri kommunikációs hangnem megfelelő és támogató jellegű.'}

A RÉSZLETES ÉRTÉKELÉS ELÉRÉSE:
=========================================
Kattints az alábbi linkre a portál közvetlen megnyitásához, ahol azonnal megtekintheted a tagolt elemzést és elvégezheted a szükséges lépéseket:
👉 ${portalUrl}

${
  isBelowThreshold
    ? '⚠️ TEENDŐ: Szükséges az eset átdolgozása a fenti szöveges iránymutatások mentén. Kérjük, nyisd meg a fenti linket a javításhoz.'
    : '✅ TEENDŐ: Kérjük, nyisd meg a fenti linket a teljes elemzés megtekintéséhez és az értékelés hivatalos elfogadásához.'
}

Üdvözlettel:
Esettanulmányok — Minőségbiztosítási Rendszer`;

    const updated: Submission = {
      ...submission,
      taskScore: Number(taskScore),
      emailScore: Number(emailScore),
      overallScore: calculatedOverallScore,
      status: isAlreadyApproved ? submission.status : updatedStatus,
      managerNotes,
      reviewedBy: managerName,
      reviewedAt: submission.reviewedAt || new Date().toISOString(),
      managerEdited: isEditingMode || submission.managerEdited,
      notificationSent: true,
      notificationMessage: notificationText,
      taskEvaluation: {
        ...submission.taskEvaluation,
        score: Number(taskScore),
        overallTaskRating: taskScore >= 75 ? 'Megfelelt' : 'Nem felelt meg (75% alatti)',
        questionEvaluations: questionEvals,
        summaryFeedback: taskSummary,
        legalAndProcedureCheck: legalCheck,
        correctPoints,
        missingPoints,
      },
      emailEvaluation: {
        ...(emailEvaluation || submission.emailEvaluation),
        score: Number(emailScore),
        scoreOutOf10: Math.round(Number(emailScore) / 10),
        overallEmailRating: emailScore >= 75 ? 'Megfelelt' : 'Nem felelt meg (75% alatti)',
        pillarFeedback: pillarEvals,
        communicationTone: commTone,
        proactivityCheck: proactivity,
        suggestedEmail,
        feedbackForEmployee: employeeFeedback,
        ...(emailEvaluation?.structuredReview || submission.emailEvaluation?.structuredReview
          ? {
              structuredReview: {
                ...(emailEvaluation?.structuredReview || submission.emailEvaluation?.structuredReview!),
                scoreOutOf10: Math.round(Number(emailScore) / 10),
                improvedEmail: suggestedEmail,
              },
            }
          : {}),
      },
    };

    // Trigger automatic email dispatch to employee via notification service and email client
    try {
      const emailRecord = sendManagerReviewEmail(
        updated,
        managerName
      );

      // Automatically open email client for manager
      openMailClient({
        to: updated.colleagueEmail,
        cc: 'karman.veronika91@gmail.com',
        subject: emailRecord.subject,
        body: emailRecord.contentBody,
      });
    } catch (err) {
      console.warn('Failed to send automated notification in manager modal:', err);
    }

    onApproveAndNotify(updated);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500 text-slate-950 text-xs font-extrabold px-2.5 py-0.5 rounded-md">
                Vezetői & HR Felülvizsgálat
              </span>
              <span className="text-slate-400 text-xs">{submission.department}</span>
            </div>
            <h2 className="text-xl font-bold mt-1.5 flex items-center space-x-2">
              <span>{submission.colleagueName}</span>
              <span className="text-slate-400 text-sm font-normal">({submission.colleagueEmail})</span>
            </h2>
            <p className="text-xs text-amber-400 font-medium mt-0.5">{submission.caseStudyTitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto">
            {/* AI Re-evaluate with latest prompt */}
            <button
              onClick={handleReevaluateWithAIPrompt}
              disabled={isReevaluating}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                isReevaluating
                  ? 'bg-amber-600/50 text-white cursor-not-allowed animate-pulse'
                  : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 ring-2 ring-amber-300'
              }`}
              title="A legújabb vezetői értékelési prompt (standardok, mátrix, idézetek, folyamatlépések) azonnali újrafuttatása"
            >
              <Sparkles className={`w-3.5 h-3.5 text-slate-950 ${isReevaluating ? 'animate-spin' : ''}`} />
              <span>{isReevaluating ? 'AI Újraértékelés...' : '🤖 AI Újraértékelés (Vezetői Prompt)'}</span>
            </button>

            {/* Manual Edit Mode toggle */}
            <button
              onClick={() => setIsEditingMode(!isEditingMode)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isEditingMode
                  ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-amber-300'
                  : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingMode ? '✏️ Szerkesztés Aktív' : 'Kézi Módosítás'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Re-evaluation feedback alerts */}
        {reevalSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-950 font-bold animate-in fade-in">
            <span className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{reevalSuccess}</span>
            </span>
            <button
              onClick={() => setReevalSuccess(null)}
              className="text-emerald-700 hover:text-emerald-900 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {reevalError && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2.5 flex items-center justify-between text-xs text-red-950 font-bold animate-in fade-in">
            <span className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{reevalError}</span>
            </span>
            <button
              onClick={() => setReevalError(null)}
              className="text-red-700 hover:text-red-900 cursor-pointer p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Összesítő & Jóváhagyás
          </button>
          <button
            onClick={() => setActiveTab('task_detail')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'task_detail'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>1. Feladatkidolgozás Értékelése ({taskScore}%)</span>
          </button>
          <button
            onClick={() => setActiveTab('email_detail')}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'email_detail'
                ? 'bg-white text-slate-900 border-t border-x border-slate-200 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-blue-600" />
            <span>2. Tájékoztató Levél Értékelése ({emailScore}%)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-slate-800">
          {/* TAB 1: OVERVIEW & APPROVAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Score Control Cards */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Pontszámok & Értékelési Szintek</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    A pontszámok a kérdés- és pillér-értékelésekből vagy közvetlenül is módosíthatók.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Task Score Box */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase block">1. Feladatkidolgozás</span>
                    {isEditingMode ? (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={taskScore}
                          onChange={(e) => setTaskScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-24 bg-amber-50/50 border border-amber-300 rounded-lg p-1.5 text-lg font-bold text-slate-900"
                        />
                        <span className="font-bold text-slate-700">%</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-slate-900 mt-1">{taskScore}%</div>
                    )}
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {taskScore >= 75 ? 'Megfelelt' : '75% alatt (Nem felelt meg)'}
                    </span>
                  </div>

                  {/* Email Score Box */}
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <span className="text-xs font-bold text-slate-500 uppercase block">2. Tájékoztató Levél</span>
                    {isEditingMode ? (
                      <div className="mt-2 flex items-center space-x-2">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={emailScore}
                          onChange={(e) => setEmailScore(Math.min(100, Math.max(0, Number(e.target.value))))}
                          className="w-24 bg-blue-50/50 border border-blue-300 rounded-lg p-1.5 text-lg font-bold text-slate-900"
                        />
                        <span className="font-bold text-slate-700">%</span>
                      </div>
                    ) : (
                      <div className="text-2xl font-black text-slate-900 mt-1">{emailScore}%</div>
                    )}
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {emailScore >= 75 ? 'Megfelelt' : '75% alatt (Nem felelt meg)'}
                    </span>
                  </div>

                  {/* Overall Score Box */}
                  <div
                    className={`p-4 rounded-xl border shadow-sm ${
                      isBelowThreshold
                        ? 'bg-red-50 border-red-200 text-red-950'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    }`}
                  >
                    <span className="text-xs font-bold uppercase block opacity-80">Összesített Átlag</span>
                    <div className="text-2xl font-black mt-1">{calculatedOverallScore}%</div>
                    <span className="text-[11px] font-bold block mt-1">
                      {isBelowThreshold ? '⚠️ 75% alatt (Újradolgozás kötelező)' : '✅ Megfelelt (Elfogadható)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-sm block">📋 Feladatkidolgozás Összegzése:</span>
                  {isEditingMode ? (
                    <textarea
                      rows={3}
                      value={taskSummary}
                      onChange={(e) => setTaskSummary(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed">{taskSummary || 'Sikeresen kiértékelve.'}</p>
                  )}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-amber-900 block mb-1">Jogszabály & Nyomtatvány:</span>
                    {isEditingMode ? (
                      <input
                        type="text"
                        value={legalCheck}
                        onChange={(e) => setLegalCheck(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-medium"
                      />
                    ) : (
                      <span className="text-slate-800">{legalCheck}</span>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <span className="font-bold text-slate-900 text-sm block">✉️ Levél & Ügyfélszolgálat Összegzése:</span>
                  {isEditingMode ? (
                    <textarea
                      rows={3}
                      value={commTone}
                      onChange={(e) => setCommTone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  ) : (
                    <p className="text-slate-700 leading-relaxed">{commTone}</p>
                  )}
                  <div className="pt-2 border-t border-slate-200">
                    <span className="font-bold text-blue-900 block mb-1">Proaktivitás & Határidők:</span>
                    {isEditingMode ? (
                      <input
                        type="text"
                        value={proactivity}
                        onChange={(e) => setProactivity(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-1.5 font-medium"
                      />
                    ) : (
                      <span className="text-slate-800">{proactivity}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Manager Feedback & Sign-off */}
              <div className="bg-amber-50/60 p-5 rounded-2xl border border-amber-200 space-y-3">
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  Vezetői Jóváhagyási Megjegyzés (A munkavállaló megkapja)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Vezető / Értékelő Neve:</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-xs">
                    Személyes Vezetői Megjegyzés / Instrukció a Munkatársnak:
                  </label>
                  <textarea
                    rows={3}
                    value={managerNotes}
                    onChange={(e) => setManagerNotes(e.target.value)}
                    placeholder="pl. Szép munka a jogszabályok kifejtésénél, a határidők kommunikációjára ügyelj legközelebb!"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs font-medium leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASK DETAIL */}
          {activeTab === 'task_detail' && (
            <div className="space-y-6 text-xs">
              {/* Original task content submitted */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm">
                    📄 A Munkavállaló által beküldött feladatmegoldás:
                  </span>
                  <span className="text-slate-400">{submission.taskDocFileName || 'feladat.docx'}</span>
                </div>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-[11px] whitespace-pre-line text-slate-800 max-h-48 overflow-y-auto">
                  {submission.taskContent}
                </div>
              </div>

              {/* Question by question evaluations */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Kérdésenkénti Szakmai Értékelés:</h4>
                  {isEditingMode && (
                    <span className="text-[11px] text-amber-700 font-bold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                      ✏️ A kérdések pontszámai és az elvárt megoldás szerkeszthetők
                    </span>
                  )}
                </div>

                {questionEvals.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border ${
                      (q.score ?? 0) >= 75 ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {q.questionNumber}. Kérdés: {q.questionText}
                      </span>

                      {isEditingMode ? (
                        <div className="flex items-center space-x-2">
                          <label className="text-[11px] font-bold text-slate-700">Pontszám:</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={q.score ?? 0}
                            onChange={(e) =>
                              handleUpdateQuestionScore(idx, Math.min(100, Math.max(0, Number(e.target.value))))
                            }
                            className="w-16 bg-white border border-slate-300 rounded-lg p-1 text-xs font-bold text-slate-900 text-center"
                          />
                          <span className="font-bold">%</span>
                        </div>
                      ) : (
                        <span
                          className={`px-2.5 py-0.5 rounded-md font-extrabold text-xs ${
                            (q.score ?? 0) >= 75 ? 'bg-emerald-200 text-emerald-950' : 'bg-red-200 text-red-950'
                          }`}
                        >
                          {q.score ?? 0}% - {(q.score ?? 0) >= 75 ? 'Helyes' : 'Pontatlan/Hiányos'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                          Kolléga válasza:
                        </span>
                        {isEditingMode ? (
                          <textarea
                            rows={3}
                            value={q.employeeAnswerSummary}
                            onChange={(e) => {
                              const updated = [...questionEvals];
                              updated[idx] = { ...updated[idx], employeeAnswerSummary: e.target.value };
                              setQuestionEvals(updated);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800"
                          />
                        ) : (
                          <p className="text-slate-800">{q.employeeAnswerSummary}</p>
                        )}
                      </div>

                      <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-amber-700 uppercase block mb-1">
                          Elvárt helyes megoldás:
                        </span>
                        {isEditingMode ? (
                          <textarea
                            rows={3}
                            value={q.correctSolutionExpected}
                            onChange={(e) => {
                              const updated = [...questionEvals];
                              updated[idx] = { ...updated[idx], correctSolutionExpected: e.target.value };
                              setQuestionEvals(updated);
                            }}
                            className="w-full bg-amber-50/50 border border-amber-200 rounded p-1.5 text-xs text-slate-800 font-medium"
                          />
                        ) : (
                          <p className="text-slate-800">{q.correctSolutionExpected}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-slate-700 font-medium">
                      <strong>Értékelői visszajelzés:</strong>{' '}
                      {isEditingMode ? (
                        <input
                          type="text"
                          value={q.feedback}
                          onChange={(e) => {
                            const updated = [...questionEvals];
                            updated[idx] = { ...updated[idx], feedback: e.target.value };
                            setQuestionEvals(updated);
                          }}
                          className="w-full bg-white border border-slate-300 rounded p-1 text-xs mt-1"
                        />
                      ) : (
                        <span>{q.feedback}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Correct & Missing Points */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 block">✅ Helyesen Kifejtett Szakmai Elemek:</span>
                    {isEditingMode && (
                      <button
                        type="button"
                        onClick={() => setCorrectPoints([...correctPoints, 'Új helyes pont'])}
                        className="text-[10px] font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded cursor-pointer"
                      >
                        + Hozzáadás
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {correctPoints.map((pt, i) => (
                      <li key={i} className="text-emerald-900 flex items-center justify-between gap-2">
                        {isEditingMode ? (
                          <div className="flex items-center w-full gap-1">
                            <input
                              type="text"
                              value={pt}
                              onChange={(e) => {
                                const updated = [...correctPoints];
                                updated[i] = e.target.value;
                                setCorrectPoints(updated);
                              }}
                              className="w-full bg-white border border-emerald-300 rounded p-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setCorrectPoints(correctPoints.filter((_, idx) => idx !== i))}
                              className="text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span>• {pt}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-red-950 block">❌ Hiányzó vagy Pontatlan Elemek:</span>
                    {isEditingMode && (
                      <button
                        type="button"
                        onClick={() => setMissingPoints([...missingPoints, 'Új hiányzó pont'])}
                        className="text-[10px] font-bold bg-red-200 text-red-950 px-2 py-0.5 rounded cursor-pointer"
                      >
                        + Hozzáadás
                      </button>
                    )}
                  </div>
                  <ul className="space-y-1.5">
                    {missingPoints.map((pt, i) => (
                      <li key={i} className="text-red-900 flex items-center justify-between gap-2">
                        {isEditingMode ? (
                          <div className="flex items-center w-full gap-1">
                            <input
                              type="text"
                              value={pt}
                              onChange={(e) => {
                                const updated = [...missingPoints];
                                updated[i] = e.target.value;
                                setMissingPoints(updated);
                              }}
                              className="w-full bg-white border border-red-300 rounded p-1 text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => setMissingPoints(missingPoints.filter((_, idx) => idx !== i))}
                              className="text-red-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span>• {pt}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMAIL DETAIL */}
          {activeTab === 'email_detail' && (
            <div className="space-y-6 text-xs">
              {/* Original email submitted */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-900 text-sm flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span>A Munkavállaló által beküldött tájékoztató levél:</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{submission.emailDocFileName || 'level.docx'}</span>
                </div>
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 font-mono text-[11px] whitespace-pre-line text-slate-800 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
                  {submission.emailContent}
                </div>
              </div>

              {/* Sub-view switcher inside Email Tab */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-slate-100 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEmailViewMode('structured')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      emailViewMode === 'structured'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                    <span>Részletes Vezetői Elemzés (Idézetek, Standardok, Mátrix)</span>
                  </button>

                  <button
                    onClick={() => setEmailViewMode('edit_pillars')}
                    className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      emailViewMode === 'edit_pillars'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    <span>Pillérek & Szövegezés Finomhangolása</span>
                  </button>
                </div>

                <button
                  onClick={handleReevaluateWithAIPrompt}
                  disabled={isReevaluating}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto ${
                    isReevaluating
                      ? 'bg-amber-600/50 text-white cursor-not-allowed animate-pulse'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                  }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isReevaluating ? 'animate-spin' : ''}`} />
                  <span>{isReevaluating ? 'AI Elemzés...' : '🤖 Újraértékelés az új Prompttal'}</span>
                </button>
              </div>

              {/* VIEW 1: STRUCTURED DEEP MENTOR REVIEW */}
              {emailViewMode === 'structured' && (
                <div className="space-y-6">
                  {/* Methodology banner */}
                  <div className="p-4 bg-gradient-to-r from-amber-50/80 via-white to-blue-50/80 rounded-2xl border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                          Pannonjob Belső Minőségbiztosítás
                        </span>
                        <span className="text-slate-500 text-[11px] font-semibold">
                          Idézet-alapú vezetői értékelés & E/2 megfogalmazás
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        A kiértékelés fókuszterületei: 1. Szakmai pontosság idézetekkel • 2. Ügyfélközpontúság & empátia • 3. Folyamatszemlélet (1–5. lépés) • 4. Túl adminisztratív fordulatok példái és emberi átfogalmazása • 5. Szempontmátrix és vezetői iránymutatás.
                      </p>
                    </div>

                    {!emailEvaluation?.structuredReview?.detailedReviewArticle && (
                      <button
                        onClick={handleReevaluateWithAIPrompt}
                        disabled={isReevaluating}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-sm transition-all cursor-pointer whitespace-nowrap flex items-center space-x-1.5 self-start sm:self-center"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Részletes Elemzés Generálása</span>
                      </button>
                    )}
                  </div>

                  {/* Render the full StructuredEmailReviewSection */}
                  <StructuredEmailReviewSection
                    emailEvaluation={emailEvaluation}
                    evaluation={emailEvaluation}
                    submittedEmailContent={submission.emailContent}
                    emailContent={submission.emailContent}
                    emailDocFileName={submission.emailDocFileName}
                    sampleEmailTemplate={sampleEmailTemplate}
                    customerStandards={customerStandards}
                    isReviewMode={true}
                  />
                </div>
              )}

              {/* VIEW 2: EDITABLE PILLARS & FEEDBACK */}
              {emailViewMode === 'edit_pillars' && (
                <div className="space-y-6">
                  {/* Customer Service Pillars Feedback */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">Ügyfélszolgálati Pillérek Értékelése:</h4>
                      {isEditingMode && (
                        <span className="text-[11px] text-blue-700 font-bold bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                          ✏️ A pillérek pontszámai és visszajelzései szerkeszthetők
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {pillarEvals.map((p, idx) => (
                        <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900">{p.pillarName}</span>
                            {isEditingMode ? (
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={p.score ?? 0}
                                  onChange={(e) =>
                                    handleUpdatePillarScore(idx, Math.min(100, Math.max(0, Number(e.target.value))))
                                  }
                                  className="w-16 bg-white border border-slate-300 rounded p-1 text-xs font-bold text-center"
                                />
                                <span className="font-bold">%</span>
                              </div>
                            ) : (
                              <span
                                className={`text-xs font-bold px-2 py-0.5 rounded ${
                                  (p.score ?? 0) >= 75 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {p.score ?? 0}%
                              </span>
                            )}
                          </div>

                          {isEditingMode ? (
                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] font-bold text-emerald-700 uppercase block">Pozitív észrevétel (Zöld):</label>
                              <input
                                type="text"
                                value={p.positiveObservation}
                                onChange={(e) => {
                                  const updated = [...pillarEvals];
                                  updated[idx] = { ...updated[idx], positiveObservation: e.target.value };
                                  setPillarEvals(updated);
                                }}
                                className="w-full bg-emerald-50 border border-emerald-200 rounded p-1.5 text-xs text-slate-800"
                              />
                              <label className="text-[10px] font-bold text-red-700 uppercase block">Fejlesztendő szempont & Kockázat (Piros):</label>
                              <textarea
                                rows={2}
                                value={p.negativeObservation || p.constructiveCriticism || p.improvementArea}
                                onChange={(e) => {
                                  const updated = [...pillarEvals];
                                  updated[idx] = {
                                    ...updated[idx],
                                    negativeObservation: e.target.value,
                                    constructiveCriticism: e.target.value,
                                    improvementArea: e.target.value,
                                  };
                                  setPillarEvals(updated);
                                }}
                                className="w-full bg-red-50 border border-red-200 rounded p-1.5 text-xs text-slate-800"
                              />
                              <label className="text-[10px] font-bold text-blue-700 uppercase block">Javasolt szövegezés:</label>
                              <input
                                type="text"
                                value={p.recommendedWording || ''}
                                onChange={(e) => {
                                  const updated = [...pillarEvals];
                                  updated[idx] = { ...updated[idx], recommendedWording: e.target.value };
                                  setPillarEvals(updated);
                                }}
                                className="w-full bg-blue-50 border border-blue-200 rounded p-1.5 text-xs text-slate-800"
                              />
                            </div>
                          ) : (
                            <div className="space-y-1.5 text-[11px]">
                              {p.positiveObservation && (
                                <p className="text-emerald-800 font-medium">
                                  ✓ <strong>Megerősítendő erősség:</strong> {p.positiveObservation}
                                </p>
                              )}
                              {(p.negativeObservation || p.constructiveCriticism || p.improvementArea) && (
                                <p className="text-red-800 font-medium">
                                  ✕ <strong>Fejlesztendő szempont & Kockázat:</strong> {p.negativeObservation || p.constructiveCriticism || p.improvementArea}
                                </p>
                              )}
                              {p.recommendedWording && (
                                <p className="text-blue-900 italic font-mono text-[10px]">
                                  💡 <strong>Javasolt szöveg:</strong> <em>„{p.recommendedWording}”</em>
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Constructive feedback for colleague */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <span className="font-bold text-slate-900 block text-sm">
                      💬 Szöveges Visszajelzés a Munkatársnak:
                    </span>
                    {isEditingMode ? (
                      <textarea
                        rows={4}
                        value={employeeFeedback}
                        onChange={(e) => setEmployeeFeedback(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-medium leading-relaxed"
                      />
                    ) : (
                      <p className="text-slate-800 whitespace-pre-line leading-relaxed">{employeeFeedback}</p>
                    )}
                  </div>

                  {/* Suggested Ideal Email */}
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                    <span className="font-bold text-amber-950 block text-sm">
                      ✨ 100%-os Mintalevél (Benchmark Referencia):
                    </span>
                    {isEditingMode ? (
                      <textarea
                        rows={8}
                        value={suggestedEmail}
                        onChange={(e) => setSuggestedEmail(e.target.value)}
                        className="w-full bg-white border border-amber-300 rounded-lg p-3 text-xs font-mono leading-relaxed"
                      />
                    ) : (
                      <div className="p-3 bg-white rounded-lg border border-amber-200 text-slate-800 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                        {suggestedEmail}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {showDeleteConfirm ? (
            <div className="flex items-center space-x-2 bg-red-50 p-2 rounded-xl border border-red-200 animate-in fade-in">
              <span className="text-xs font-bold text-red-900">Biztosan törlöd ezt a beküldött esetet?</span>
              <button
                type="button"
                onClick={() => {
                  onDeleteSubmission(submission.id);
                  onClose();
                }}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all shadow-xs"
              >
                Igen, törlés
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-medium rounded-lg cursor-pointer"
              >
                Mégse
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline cursor-pointer flex items-center space-x-1 py-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Beküldés Törlése</span>
            </button>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-colors"
            >
              {isAlreadyApproved ? 'Bezárás' : 'Mégse'}
            </button>

            {isAlreadyApproved ? (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-xl text-xs font-extrabold shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                  <span>
                    Jóváhagyva & Értesítő elküldve
                    {submission.reviewedBy ? ` (${submission.reviewedBy})` : ''}
                  </span>
                </div>

                {isEditingMode && (
                  <button
                    onClick={handleApprove}
                    className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>Módosítások Mentése</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleApprove}
                className="flex items-center space-x-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold shadow-md cursor-pointer transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Jóváhagyás & Automatikus Értesítő Küldése a Munkavállalónak</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
