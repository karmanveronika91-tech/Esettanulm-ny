export interface CaseStudy {
  id: string;
  caseNumber?: number;
  title: string;
  category: string;
  description: string;
  taskQuestions: string;
  communicationFocus: string;
  solutionGuide: string; // 1. Feladatokra vonatkozó helyes szakmai megoldás (Vezetői etalon)
  sampleEmailTemplate?: string; // 2. Sablon levél / etalon mintalevél az értékeléshez
  legalAndForms: string;
  isDefault?: boolean;
}

export type UserRole = 'admin' | 'employee';

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position?: string;
  role: UserRole; // 'admin' (Vezető / Értékelő) or 'employee' (Munkavállaló)
  username?: string; // pl. kovacs.balazs
  password?: string; // Beállított jelszó
  defaultPassword?: string; // Alaphelyzeti jelszó (pl. KOVÁCS123)
  mustChangePassword?: boolean; // Ha true, bejelentkezéskor kötelező az új jelszó megadása
  passwordChangedAt?: string;
  active: boolean;
}

export interface SentEmailNotification {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  sentAt: string;
  type: 'evaluation_completed' | 'manager_approved' | 'redo_required' | 'assignment_notice';
  submissionId?: string;
  caseStudyTitle: string;
  overallScore?: number;
  contentBody: string;
}

export interface CaseAssignment {
  id: string;
  caseStudyId: string;
  caseStudyTitle: string;
  assignmentType: 'individual' | 'pair'; // Munkavállalónként vagy kétfős csoportonként
  assignedEmployees: {
    id: string;
    name: string;
    email: string;
    department: string;
  }[];
  assignedBy: string;
  assignedAt: string;
  deadline: string;
  instructions?: string;
  status: 'assigned' | 'in_progress' | 'submitted' | 'completed' | 'expired';
  submissionId?: string;
  notificationSent?: boolean;
  notificationMessage?: string;
}

export interface CSPillarSubPoint {
  id: string;
  title: string;
  description: string;
}

export interface CustomerServicePillar {
  id: string;
  title: string;
  category: string;
  description: string;
  subPoints: CSPillarSubPoint[];
  isActive: boolean;
}

export interface ScoreDeduction {
  item: string;
  pointsDeducted: number;
  reason: string;
}

export interface EvaluationCriterion {
  name: string; // "Pontosság" | "Szakmai helyesség" | "Ügyfélközpontúság" | "Kommunikáció" | "Teljesség" | "Folyamatkövetés" | "Kockázatok kezelése" | "Belső szabályok alkalmazása"
  scoreOutOf10: number; // 1-10
  reasoning: string; // Részletes szakmai indoklás a pontszámhoz
  positivePoints: string[]; // 🟢 Zöld pozitívumok: ami szakmailag helyes, követendő
  improvementPoints: string[]; // 🔴 Piros fejlesztendő pontok: ami hibás, hiányos, javításra szorul
  impactAssessment?: string; // Milyen hatással van a címzettre, munkavállalóra vagy partnerre
}

export interface OverallEvaluationSummary {
  overallScore: number;
  taskScore: number;
  emailScore: number;
  generalAssessment: string; // Általános szakmai értékelés
  keyPositivePoints: string[]; // 🟢 Legfontosabb pozitívumok
  keyImprovementPoints: string[]; // 🔴 Legfontosabb fejlesztendő területek
  keyTakeaways: string[]; // 2-3 konkrét tanulság a jövőbeni feladatokhoz
}

export interface QuestionEvaluation {
  questionNumber: number;
  questionText: string;
  score: number; // 0-100
  scoreOutOf10?: number; // 1-10 skálán
  isCorrect: boolean;
  employeeAnswerSummary: string;
  correctSolutionExpected: string;
  feedback: string;
  positivePoints?: string[]; // 🟢 Zölddel megjelenítendő pozitívumok
  improvementPoints?: string[]; // 🔴 Pirossal megjelenítendő hibák, hiányosságok
  detailedReasoning?: string; // Részletes szakmai indoklás: mi a probléma, miért probléma, hatás
  suggestedApproach?: string; // Mit kellett volna másképp megközelíteni, konkrét javasolt megfogalmazás
  scoreDeductionReason?: string; // Konkrét indoklás, ha a pontszám < 100%
  isUnanswered?: boolean; // Ha a kérdés megválaszolatlan maradt (0 pont)
}

export interface TaskEvaluation {
  score: number; // 0-100
  overallTaskRating: string;
  questionEvaluations: QuestionEvaluation[];
  correctPoints: string[];
  missingPoints: string[];
  legalAndProcedureCheck: string;
  summaryFeedback: string;
  deductionExplanation?: string; // Tételes levezetés: miért nem 100% a feladatmegoldás
  deductions?: ScoreDeduction[]; // Tételes levonások listája
  criteriaEvaluations?: EvaluationCriterion[]; // A feladathoz releváns szempontok 10-es skálán indoklással
}

export interface PillarFeedback {
  pillarName: string;
  score: number;
  isSatisfied: boolean;
  positiveObservation: string;
  improvementArea: string;
  negativeObservation?: string; // Fejlesztendő szempont, kockázat vagy félreértés
  constructiveCriticism?: string; // Kompatibilitás
  recommendedWording?: string; // Konkrét javasolt megfogalmazás és fordulat
}

export interface PhraseCritique {
  originalPhrase: string;
  issueExplanation: string;
  suggestedAlternative: string;
}

export interface StandardEvaluationItem {
  standardName: string; // Standard / elvárás (mit ír elő a betáplált standard)
  letterAssessment: string; // A levél értékelése (hogyan teljesül az elvárás)
  status: 'Megfelel' | 'Részben megfelel' | 'Nem felel meg'; // Minősítés
  reasoning: string; // Konkrét, részletes magyarázat
  suggestedCorrection?: string; // Javasolt megfogalmazás (ha szükséges)
}

export interface ProfessionalAssessment {
  contentAccuracy: string; // A tartalom pontossága
  informationCompleteness: string; // A szükséges információk megléte és a válasz teljessége
  professionalMistakes: string; // Esetleges szakmai hibák
  riskyOrMisleadingPhrasing: string; // Esetleges félreérthető vagy kockázatos megfogalmazások
  overallProfessionalSummary: string; // Részletes szakmai összefoglaló
}

export interface CommunicationAssessment {
  toneAndEmpathy: string; // Hangnem és empátia
  customerFocusAndHelpfulness: string; // Ügyfélközpontúság és segítőkészség
  clarityAndProfessionalism: string; // Egyértelműség és professzionalizmus
  sentenceAndStructureClarity: string; // Mondatok és bekezdések érthetősége, a levél szerkezete
  overallCommunicationSummary: string; // Részletes kommunikációs összefoglaló
}

export interface ConcreteDevelopmentSuggestion {
  priority: number; // Fontossági sorrend (1, 2, 3...)
  originalProblematicPhrase: string; // Eredeti problémás megfogalmazás
  issueExplanation: string; // Miért problémás
  suggestedAlternative: string; // Milyen megfogalmazás lenne megfelelőbb
}

export interface EmailReviewSummary {
  positiveFeedback: string[]; // Pozitív visszajelzés pontjai
  improvementAreas: string[]; // Fejlesztendő pontok
  mainDevelopmentFocus: string; // Legfontosabb fejlesztési pont
}

export interface AspectScoreTableItem {
  criterion: string; // pl. Szakmai tartalom, Egyértelműség, Kockázatok kommunikálása, Egyszerűség, Empátia, Segítőkészség érzete, Következő lépések egyértelműsége, Összesített ügyfélélmény
  score: string; // pl. "8/10", "7/10", "6/10"
  note?: string; // rövid megjegyzés
}

export interface StructuredEmailReview {
  overview: string; // 1. Összkép: vezetői szemléletű összefoglaló
  scoreOutOf10: number; // 2. Pontszám: 10 pontos skálán (pl. 7)
  scoreReasoning: string; // A pontszám indoklása a standardok és ügyfélélmény alapján
  detailedReviewArticle?: string; // Teljes, rendkívül részletes vezetői elemzés (Pontosság x/10, Ügyfélközpontúság x/10, Folyamat, Adminisztratív nyelv javítása konkrét példákkal, Hangnem)
  aspectScoresTable?: AspectScoreTableItem[]; // Szempontok pontozó táblázata (Szakmai tartalom, Egyértelműség, Kockázatok, Egyszerűség, Empátia, Segítőkészség, Következő lépések, Összesített ügyfélélmény)
  flowSteps?: string[]; // A tiszta folyamat lépései (1. -> 2. -> 3. -> 4. -> 5.)
  mindsetShift?: string; // A legfontosabb szemléleti változtatás (pl. ne azt mondjuk mit nem szabad, hanem hogy hogyan segítünk)
  standardsEvaluation: StandardEvaluationItem[]; // Részletes értékelés standardonként
  summary?: EmailReviewSummary; // Összegzés: Pozitív visszajelzés, Fejlesztendő pontok, Legfontosabb fejlesztési pont
  professionalAssessment?: ProfessionalAssessment; // Szakmai értékelés
  communicationAssessment?: CommunicationAssessment; // Kommunikációs értékelés
  developmentSuggestions?: ConcreteDevelopmentSuggestion[]; // Konkrét fejlesztési javaslatok
  improvedEmail: string; // Javított levél (belső referencia)
}

export interface EmailEvaluation {
  score: number; // 0-100
  scoreOutOf10?: number; // 1-10 skálán
  overallEmailRating: string;
  correctPoints: string[];
  missingPoints: string[];
  riskAssessment: string;
  customerServiceScore: number;
  pillarFeedback: PillarFeedback[];
  communicationTone: string;
  proactivityCheck: string;
  suggestedEmail: string;
  feedbackForEmployee: string;
  detailedAnalysis?: string; // Részletes szakmai és kommunikációs elemzés (szöveges értékelés, konkrét mondatok, folyamatlépések)
  constructiveCriticismSummary?: string; // Átfogó összefoglaló
  phrasesToAvoidAndFix?: PhraseCritique[]; // Kerülendő vs. javasolt kifejezések
  criticalMistakes?: string[]; // Súlyos, elkövetett hibák listája
  deductionExplanation?: string; // Tételes levezetés: miért nem 100% a levél
  deductions?: ScoreDeduction[]; // Tételes levonások listája
  structuredReview?: StructuredEmailReview; // 7 pontos kötelező levélértékelési keretrendszer
}

export type SubmissionStatus =
  | 'pending_review' // Waiting for manager/HR approval
  | 'approved' // Manager approved, waiting for employee decision
  | 'accepted' // Employee accepted the evaluation
  | 'redo_required' // Below 75%, employee must redo
  | 'redo_requested'; // Employee decided to redo (>75% but wants higher)

export interface Submission {
  id: string;
  caseStudyId: string;
  caseStudyTitle: string;
  colleagueName: string;
  colleagueEmail: string;
  department: string;
  submittedAt: string;
  taskDocFileName?: string;
  taskContent: string;
  emailDocFileName?: string;
  emailContent: string;
  taskScore: number;
  emailScore: number;
  overallScore: number;
  status: SubmissionStatus;
  taskEvaluation: TaskEvaluation;
  emailEvaluation: EmailEvaluation;
  managerNotes?: string;
  managerEdited?: boolean;
  reviewedAt?: string;
  reviewedBy?: string;
  employeeDecision?: 'accepted' | 'redo';
  employeeDecisionAt?: string;
  notificationSent?: boolean;
  notificationMessage?: string;
  overallSummary?: OverallEvaluationSummary;
  criteriaEvaluations?: EvaluationCriterion[];
}

export interface EvaluationRecord extends Submission {}

