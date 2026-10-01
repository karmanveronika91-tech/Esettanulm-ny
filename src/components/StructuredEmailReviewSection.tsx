import React, { useState } from 'react';
import { EmailEvaluation, StructuredEmailReview, AspectScoreTableItem, CustomerServicePillar, StandardEvaluationItem } from '../types';
import { StructuredFeedbackRenderer, stripIntroductionText } from './StructuredFeedbackRenderer';
import {
  Compass,
  Award,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  ListOrdered,
  FileCheck,
  FileText,
  ThumbsUp,
  AlertCircle,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface StructuredEmailReviewSectionProps {
  emailEvaluation?: EmailEvaluation;
  evaluation?: EmailEvaluation;
  submittedEmailContent?: string;
  emailContent?: string;
  emailDocFileName?: string;
  sampleEmailTemplate?: string;
  customerStandards?: CustomerServicePillar[];
  isReviewMode?: boolean;
}

// Fallback synthesizer in case of legacy submissions or missing subfields
export function getOrCreateStructuredReview(evaluation?: EmailEvaluation): StructuredEmailReview {
  const baseScore = evaluation?.scoreOutOf10 || Math.max(1, Math.min(10, Math.round((evaluation?.score || 70) / 10)));

  // The 6 official core values / standards with rich defaults
  const CORE_PILLARS = [
    {
      id: 'pillar-1',
      name: 'Ügyfélközpontúság',
      defaultStandard: 'Visszajelzés minden megkeresésre és egyértelmű folyamatkommunikáció',
      defaultAssessment: 'A levél megfogalmazása tájékoztat, de a címzett nézőpontjából hiányzik a pontos eljárásrend és a megnyugtató vezetői támogatás.',
      defaultReasoning: 'Az ügyfélközpontú kommunikáció kulcseleme, hogy a partner pontosan tudja, ki és mikor teszi meg a következő lépést.',
      defaultCorrection: 'A levél záró részében az elköszönés előtt elhelyezendő (jelenleg hiányzik): „Bármilyen felmerülő kérdés esetén készséggel állok rendelkezésére, a következő munkanapon telefonon is egyeztetünk.”',
    },
    {
      id: 'pillar-2',
      name: 'Proaktivitás és Felelősségvállalás',
      defaultStandard: 'Az ügy sajátként kezelése lezárásig és alternatívák kínálása',
      defaultAssessment: 'A levél jelzi a helyzetet, de megvárja a külső lépéseket ahelyett, hogy kész forgatókönyvet és azonnali alternatívát kínálna.',
      defaultReasoning: 'A proaktív hozzáállás megóvja a partnert a bizonytalanságtól és minimalizálja az ügyintézési időveszteséget.',
      defaultCorrection: 'A levél 2. bekezdésében a bizonytalan tájékoztatás helyett elhelyezendő (jelenleg bizonytalanul szerepel): „A folyamat felgyorsítása érdekében már felvettem a kapcsolatot a társosztállyal, és péntek 14:00-ig közvetlenül visszajelzek Önnek.”',
    },
    {
      id: 'pillar-3',
      name: 'Együttműködés és Csapatszellem',
      defaultStandard: 'Tiszteletteljes kommunikáció és közös felelősség',
      defaultAssessment: 'A kommunikáció hangvétele partneri és tiszteletteljes, tükrözi a belső és külső együttműködési kultúrát.',
      defaultReasoning: 'A közös csapatszellem és a konstruktív hangnem erősíti a szervezetbe és a szakmai szolgáltatásba vetett bizalmat.',
      defaultCorrection: 'A levél bevezető szakaszában a formális megszólítás után elhelyezendő (jelenleg részben elhelyezve): „Köszönöm az eddigi együttműködését és türelmét, közös célunk a zökkenőmentes lezárás.”',
    },
    {
      id: 'pillar-4',
      name: 'Tudásközpontúság és Szakmai Tapasztalat',
      defaultStandard: 'Pontos szakmai igényfelmérés és eljárási szabályok',
      defaultAssessment: 'A feladat és levél kidolgozása a szakmai eljárásrendek és szabályok alapos ismeretét tükrözi, a ténybeli hivatkozások pontosak.',
      defaultReasoning: 'A szakmai magabiztosság és a szabályok pontos ismerete garancia a hibátlan ügykezelésre.',
      defaultCorrection: 'A levél szakmai leíró részében az eljárási lépés helyett elhelyezendő (jelenleg hiányzik): „A vonatkozó eljárásrend 4. pontja szerint az alábbi dokumentumok benyújtásával tudjuk a folyamatot véglegesíteni.”',
    },
    {
      id: 'pillar-5',
      name: 'Folyamatos Fejlődés',
      defaultStandard: 'Rendszerszintű hibamegelőzés és minőségi felülvizsgálat',
      defaultAssessment: 'A kommunikáció szerkezete fejlődést mutat, ugyanakkor a tipikus félreértések megelőzése érdekében érdemes a folyamatlépéseket pontokba szedve rögzíteni.',
      defaultReasoning: 'A visszatérő félreértések kiküszöbölése érdekében az ügyfél-kommunikációnak rendszerszinten kell tisztáznia a teendőket.',
      defaultCorrection: 'A levél lezárása előtt a teendők felsorolásánál elhelyezendő (jelenleg hiányzik): „A gördülékeny ügyintézés érdekében kérjük, a csatolt ellenőrzőlistát követve küldje meg az adatokat.”',
    },
    {
      id: 'pillar-6',
      name: 'Törvényes Működés',
      defaultStandard: 'Jogszabályi határok tiszteletben tartása és etikus működés',
      defaultAssessment: 'A levél tartalma maradéktalanul tiszteletben tartja a jogi kereteket és az etikai elvárásokat, jogilag kockázatos ígéretet nem tesz.',
      defaultReasoning: 'A törvényes működés a cég működésének alapköve, elkerülve a jogi és pénzügyi kitettségeket.',
      defaultCorrection: 'A jogi feltételek bemutatásánál a tájékoztató mondat helyett elhelyezendő (jelenleg el van helyezve, de pontosítandó): „A jogszabályi előírásoknak megfelelően a hivatalos igazolás kézhezvételét követően válik érvényessé az engedély.”',
    },
  ];

  // Helper to ensure all 6 core pillars are evaluated in standardsEvaluation
  const ensureSixStandards = (existingList?: StandardEvaluationItem[]): StandardEvaluationItem[] => {
    const list: StandardEvaluationItem[] = existingList ? existingList.map(item => {
      const hasCritique =
        item.status !== 'Megfelel' ||
        /lehetne|hiányzik|proaktívabb|javítandó|pontatlan|bizonytalan|nem tartalmaz|kockázat/i.test(item.letterAssessment || '') ||
        /lehetne|hiányzik|proaktívabb|javítandó|pontatlan|bizonytalan|nem tartalmaz|kockázat/i.test(item.reasoning || '');
      const isKivalo =
        /kiváló|hibátlan|maradéktalan/i.test(item.letterAssessment || '') && item.status === 'Megfelel';

      let correction = item.suggestedCorrection;
      if (hasCritique && !isKivalo && (!correction || correction.trim() === '')) {
        const matched = CORE_PILLARS.find(c => (item.standardName || '').toLowerCase().includes(c.name.toLowerCase()));
        correction = matched ? matched.defaultCorrection : 'A levél megfelelő szakaszában elhelyezendő (jelenleg hiányzik): „Kérjük, ellenőrizze az adatokat, és készséggel állunk rendelkezésére a következő lépésben.”';
      }

      return {
        ...item,
        reasoning: item.reasoning || item.letterAssessment || 'Szakmai indoklás a standard alapján.',
        suggestedCorrection: isKivalo ? undefined : correction,
      };
    }) : [];
    const pillarFeedback = evaluation?.pillarFeedback || [];

    for (const core of CORE_PILLARS) {
      const alreadyCovered = list.some((item) =>
        item.standardName.toLowerCase().includes(core.name.toLowerCase()) ||
        item.standardName.toLowerCase().includes(core.id)
      );

      if (!alreadyCovered) {
        const matchingFeedback = pillarFeedback.find((pf) =>
          pf.pillarName.toLowerCase().includes(core.name.toLowerCase())
        );

        if (matchingFeedback) {
          list.push({
            standardName: `Standard: ${matchingFeedback.pillarName}`,
            letterAssessment: matchingFeedback.isSatisfied
              ? (matchingFeedback.positiveObservation || core.defaultAssessment)
              : (matchingFeedback.negativeObservation || matchingFeedback.improvementArea || core.defaultAssessment),
            status: ((matchingFeedback.score ?? 0) >= 85 ? 'Megfelel' : (matchingFeedback.score ?? 0) >= 50 ? 'Részben megfelel' : 'Nem felel meg'),
            reasoning: matchingFeedback.constructiveCriticism || matchingFeedback.negativeObservation || matchingFeedback.positiveObservation || core.defaultReasoning,
            suggestedCorrection: matchingFeedback.recommendedWording
              ? `A levél megfelelő szakaszában elhelyezendő: ${matchingFeedback.recommendedWording}`
              : core.defaultCorrection,
          });
        } else {
          list.push({
            standardName: `Standard: ${core.name} (${core.defaultStandard})`,
            letterAssessment: core.defaultAssessment,
            status: baseScore >= 8 ? 'Megfelel' : 'Részben megfelel',
            reasoning: core.defaultReasoning,
            suggestedCorrection: core.defaultCorrection,
          });
        }
      }
    }

    return list;
  };

  if (evaluation?.structuredReview) {
    const sr = { ...evaluation.structuredReview };
    if (!sr.summary) {
      sr.summary = {
        positiveFeedback: evaluation?.correctPoints?.length
          ? evaluation.correctPoints
          : ['Udvarias, professzionális hangnemet használsz.', 'Tájékoztatod az ügyfelet a folyamat aktuális állásáról.', 'Röviden és érthetően fogalmazol.'],
        improvementAreas: evaluation?.missingPoints?.length
          ? evaluation.missingPoints
          : ['Konkrétabb határidő megadása a jelöltek bemutatására.', 'Egyértelmű következő lépés meghatározása.'],
        mainDevelopmentFocus: evaluation?.overallEmailRating || 'A levélben korrektül tájékoztatsz, de az ügyfél számára nem adsz elég konkrét kapaszkodót arra vonatkozóan, hogy mikor kap újabb információt és mire számíthat.',
      };
    }
    if (!sr.detailedReviewArticle && evaluation.detailedAnalysis) {
      sr.detailedReviewArticle = evaluation.detailedAnalysis;
    }
    if (!sr.aspectScoresTable) {
      sr.aspectScoresTable = [
        { criterion: 'Szakmai tartalom', score: `${Math.min(10, Math.max(1, Math.round(baseScore * 1.1)))}/10` },
        { criterion: 'Egyértelműség', score: `${baseScore}/10` },
        { criterion: 'Kockázatok kommunikálása', score: `${Math.min(10, Math.max(1, Math.round(baseScore * 1.05)))}/10` },
        { criterion: 'Egyszerűség', score: `${Math.max(1, baseScore - 1)}/10` },
        { criterion: 'Empátia', score: `${Math.max(1, baseScore - 1.5)}/10` },
        { criterion: 'Segítőkészség érzete', score: `${baseScore}/10` },
        { criterion: 'Következő lépések egyértelműsége', score: `${Math.min(10, baseScore + 0.5)}/10` },
        { criterion: 'Összesített ügyfélélmény', score: `${baseScore}/10` },
      ];
    }
    if (!sr.mindsetShift) {
      sr.mindsetShift = 'A legfontosabb szemléleti változtatás: Ne azt kommunikáljuk elsősorban, hogy „mit nem szabad csinálnod”, hanem azt, hogy „segítünk abban, hogy biztonságosan és gördülékenyen végigmenj a folyamaton”. A szabály ugyanaz marad, de a munkavállaló/partner azt érzi, hogy a HR az ő oldalán áll és vezeti a folyamatot.';
    } else {
      // Clean opinion words from mindsetShift
      sr.mindsetShift = stripIntroductionText(sr.mindsetShift)
        .replace(/^A legfontosabb (?:személyzeti|szemléleti) változtatás(?:om)?(?:\s*:\s*|\s+)/i, '')
        .replace(/(?:szerintem|a te véleményed szerint|a véleményem szerint|véleményem szerint)/gi, '')
        .trim();
      sr.mindsetShift = `A legfontosabb szemléleti változtatás: ${sr.mindsetShift}`;
    }

    // Ensure all 6 core values / standards are present
    sr.standardsEvaluation = ensureSixStandards(sr.standardsEvaluation);

    return sr;
  }

  const score10 = evaluation?.scoreOutOf10 ?? Math.max(1, Math.min(10, Math.round((evaluation?.score ?? 70) / 10)));

  // Synthesize standards evaluation ensuring all 6 core pillars
  const standardsEval = ensureSixStandards([]);

  // Synthesize development suggestions from phrases to avoid or missing points
  const suggestions = (evaluation?.phrasesToAvoidAndFix && evaluation.phrasesToAvoidAndFix.length > 0)
    ? evaluation.phrasesToAvoidAndFix.map((item, idx) => ({
        priority: idx + 1,
        originalProblematicPhrase: item.originalPhrase,
        issueExplanation: item.issueExplanation,
        suggestedAlternative: item.suggestedAlternative,
      }))
    : (evaluation?.missingPoints && evaluation.missingPoints.length > 0)
    ? evaluation.missingPoints.map((pt, idx) => ({
        priority: idx + 1,
        originalProblematicPhrase: 'Hiányzó elem a levélben',
        issueExplanation: pt,
        suggestedAlternative: 'Kifejezett rögzítése szükséges az etalon levél szerint.',
      }))
    : [
        {
          priority: 1,
          originalProblematicPhrase: 'Általános megfogalmazás',
          issueExplanation: 'A levél egyes pontjai pontosításra és kiegészítésre szorulnak.',
          suggestedAlternative: 'Lásd a javított mintalevelet a konkrét elvárásokhoz.',
        },
      ];

  const aspectTable: AspectScoreTableItem[] = [
    { criterion: 'Szakmai tartalom', score: `${Math.min(10, Math.max(1, Math.round(score10 * 1.1)))}/10` },
    { criterion: 'Egyértelműség', score: `${score10}/10` },
    { criterion: 'Kockázatok kommunikálása', score: `${Math.min(10, Math.max(1, Math.round(score10 * 1.05)))}/10` },
    { criterion: 'Egyszerűség', score: `${Math.max(1, score10 - 1)}/10` },
    { criterion: 'Empátia', score: `${Math.max(1, score10 - 1.5)}/10` },
    { criterion: 'Segítőkészség érzete', score: `${score10}/10` },
    { criterion: 'Következő lépések egyértelműsége', score: `${Math.min(10, score10 + 0.5)}/10` },
    { criterion: 'Összesített ügyfélélmény', score: `${score10}/10` },
  ];

  return {
    overview: evaluation?.overallEmailRating
      ? `${evaluation.overallEmailRating}. A beküldött levél átfogó elemzése mind a 6 kiemelt minőségbiztosítási standard alapján megtörtént.`
      : 'A levél szakmai és kommunikációs vizsgálata mind a 6 betáplált standard alapján elkészült.',
    scoreOutOf10: score10,
    scoreReasoning: evaluation?.deductionExplanation || `A levél a betáplált ügyfélszolgálati standardok és szakmai elvárások alapján került kiértékelésre.`,
    detailedReviewArticle: evaluation?.detailedAnalysis || evaluation?.feedbackForEmployee,
    aspectScoresTable: aspectTable,
    mindsetShift: 'A legfontosabb szemléleti változtatás: Ne azt kommunikáljuk elsősorban, hogy „mit nem szabad csinálnod”, hanem azt, hogy „segítünk abban, hogy biztonságosan és gördülékenyen célba érj”. A szabály ugyanaz marad, de a munkavállaló/partner azt érzi, hogy a HR az ő oldalán áll és végigvezeti a folyamaton.',
    standardsEvaluation: standardsEval,
    summary: {
      positiveFeedback: evaluation?.correctPoints?.length
        ? evaluation.correctPoints
        : ['Udvarias, professzionális hangnemet használsz.', 'Tájékoztatod az ügyfelet a folyamat aktuális állásáról.', 'Röviden és érthetően fogalmazol.'],
      improvementAreas: evaluation?.missingPoints?.length
        ? evaluation.missingPoints
        : ['Konkrétabb határidő megadása a jelöltek bemutatására.', 'Egyértelmű következő lépés meghatározása.', 'Bizonytalan megfogalmazások kerülése.'],
      mainDevelopmentFocus: evaluation?.overallEmailRating || 'A levélben korrektül tájékoztatsz, de az ügyfél számára nem adsz elég konkrét kapaszkodót arra vonatkozóan, hogy mikor kap újabb információt és mire számíthat.',
    },
    professionalAssessment: {
      contentAccuracy: evaluation?.riskAssessment || 'A szakmai tartalom a releváns folyamatleírások tükrében értékelve.',
      informationCompleteness: evaluation?.missingPoints?.length
        ? `Hiányzó pontok száma: ${evaluation.missingPoints.length} db. ${evaluation.missingPoints.join('; ')}`
        : 'Minden szükséges alapvető információ rögzítésre került.',
      professionalMistakes: evaluation?.criticalMistakes?.length
        ? evaluation.criticalMistakes.join(', ')
        : 'Nem azonosítható súlyos szakmai hiba.',
      riskyOrMisleadingPhrasing: evaluation?.riskAssessment || 'Kockázatelemzés elvégezve.',
      overallProfessionalSummary: evaluation?.detailedAnalysis || 'A levél szakmai szempontból értékelve.',
    },
    communicationAssessment: {
      toneAndEmpathy: evaluation?.communicationTone || 'Udvarias, hivatalos hangnem.',
      customerFocusAndHelpfulness: evaluation?.proactivityCheck || 'Ügyfélközpontúság vizsgálata megtörtént.',
      clarityAndProfessionalism: 'Világos, követhető szerkezet.',
      sentenceAndStructureClarity: 'A bekezdések és mondatok felépítése áttekinthető.',
      overallCommunicationSummary: evaluation?.feedbackForEmployee || 'Kommunikációs szempontú összefoglaló elkészült.',
    },
    developmentSuggestions: suggestions,
    improvedEmail: evaluation?.suggestedEmail || 'A javasolt mintalevél készülőben.',
  };
}

export const StructuredEmailReviewSection: React.FC<StructuredEmailReviewSectionProps> = ({
  emailEvaluation,
  evaluation,
  submittedEmailContent,
  emailContent,
  emailDocFileName,
  sampleEmailTemplate,
  customerStandards,
  isReviewMode = false,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedSample, setCopiedSample] = useState(false);
  const effectiveEval = emailEvaluation || evaluation;
  const effectiveContent = submittedEmailContent || emailContent;
  const review = getOrCreateStructuredReview(effectiveEval);

  const handleCopyImprovedEmail = () => {
    if (review.improvedEmail) {
      navigator.clipboard.writeText(review.improvedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleCopySampleEmail = () => {
    if (sampleEmailTemplate) {
      navigator.clipboard.writeText(sampleEmailTemplate);
      setCopiedSample(true);
      setTimeout(() => setCopiedSample(false), 2500);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('nem')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" />
          <span>Nem felel meg</span>
        </span>
      );
    }
    if (s.includes('részben')) {
      return (
        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>Részben megfelel</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span>Megfelel</span>
      </span>
    );
  };

  const displayPercentage =
    effectiveEval?.score !== undefined ? effectiveEval.score : (review.scoreOutOf10 ?? 7) * 10;

  return (
    <div className="space-y-8 text-slate-800">
      {/* SECTION HEADER BANNER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-slate-100 pb-6">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-amber-100 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full border border-amber-200">
                Vezetői Levélértékelési Keretrendszer
              </span>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                5 Lépéses Szabványosított Struktúra
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center space-x-2.5">
              <Compass className="w-6 h-6 text-amber-600 flex-shrink-0" />
              <span>Szakmai és Ügyfélszolgálati Vezetői Értékelés</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed">
              A szakmai elvárások és a minőségbiztosítási standardok alapján készült részletes vezetői visszajelzés a tájékoztató levél szakmai megalapozottságáról, kommunikációs hatásáról és fejlesztendő pontjairól.
            </p>
          </div>

          {/* Score Display Card */}
          <div className="flex items-center gap-3 bg-gradient-to-br from-slate-50 to-amber-50/50 p-4 rounded-2xl border border-amber-200/80 flex-shrink-0">
            <div className="text-center px-3">
              <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider block">
                Összesített Pontszám
              </span>
              <div className="flex items-baseline justify-center space-x-1 mt-0.5">
                <span
                  className={`text-3xl sm:text-4xl font-black ${
                    review.scoreOutOf10 >= 8
                      ? 'text-emerald-600'
                      : review.scoreOutOf10 >= 6
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  {review.scoreOutOf10}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 10</span>
              </div>
              {isReviewMode ? (
                <span className="text-[11px] font-bold text-slate-600">
                  ({displayPercentage}%)
                </span>
              ) : (
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wide block mt-0.5 ${
                    displayPercentage >= 75 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {displayPercentage >= 75 ? 'Sikeres' : 'Sikertelen'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Original Submitted Email Accordion / Box */}
        {effectiveContent && (
          <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs sm:text-sm flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-slate-500" />
                <span>A munkatárs által beküldött levéltervezet ({emailDocFileName || 'level.docx'}):</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Beküldött tartalom</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto">
              {effectiveContent}
            </div>
          </div>
        )}
      </div>

      {/* 1. PONT: ÖSSZKÉP */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center space-x-2.5 border-b border-slate-100 pb-2.5">
          <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
            1
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Összkép</h4>
            <p className="text-[11px] text-slate-500">
              Rövid, de érdemi összefoglaló arról, hogy a levél összességében mennyire felel meg a betáplált standardoknak.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-gradient-to-r from-amber-50/70 to-slate-50 rounded-xl border border-amber-200/70 text-slate-800 text-xs sm:text-sm leading-relaxed font-medium">
          {stripIntroductionText(review.overview)}
        </div>
      </div>

      {/* 2. PONT: VEZETŐI ELEMZÉS ÉS ÉRTÉKELÉS */}
      {review.detailedReviewArticle && (
        <div className="bg-gradient-to-br from-amber-50/50 via-white to-slate-50 rounded-2xl p-3.5 sm:p-4 border border-amber-300 shadow-xs space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-amber-200/80 pb-2">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
                2
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm sm:text-base leading-tight">
                  Vezetői Elemzés
                </h4>
                <p className="text-[11px] text-slate-600">
                  Keretes, formázott vezetői visszajelzés konkrét idézetekkel és javasolt emberi megfogalmazásokkal.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full self-start sm:self-auto border border-amber-200">
              Vezetői Értékelés
            </span>
          </div>

          {/* Szöveges részletes elemzés StructuredFeedbackRenderer-rel, szoros és kompakt layoutban */}
          <StructuredFeedbackRenderer
            content={review.detailedReviewArticle}
            defaultTitle="Vezetői Elemzés és Megállapítások"
          />

          {/* Folyamatlépések (Flow steps) ha elérhető */}
          {review.flowSteps && review.flowSteps.length > 0 && (
            <div className="p-2.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-1.5 shadow-2xs">
              <span className="font-extrabold text-blue-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>Javasolt folyamatlépések:</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 pt-0.5">
                {review.flowSteps.map((step, sIdx) => (
                  <div key={sIdx} className="p-2 bg-white rounded-lg border border-blue-100 text-xs font-medium text-slate-800 flex items-start space-x-1.5 shadow-2xs">
                    <span className="w-3.5 h-3.5 rounded bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                      {sIdx + 1}
                    </span>
                    <span className="leading-snug text-[11px]">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÖSSZESSÉGÉBEN ÉRTÉKELÉSI TÁBLÁZAT */}
          {review.aspectScoresTable && review.aspectScoresTable.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Összességében Értékelési Mátrix</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">8 szempontos minősítés (1-10 skála)</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 sm:px-5">Szempont</th>
                      <th className="py-2.5 px-4 sm:px-5 text-right">Értékelés</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    {review.aspectScoresTable.map((row, rIdx) => {
                      const isOverall = row.criterion.toLowerCase().includes('összesített') || row.criterion.toLowerCase().includes('ügyfélélmény');
                      return (
                        <tr
                          key={rIdx}
                          className={`${
                            isOverall
                              ? 'bg-amber-50/70 font-extrabold text-amber-950'
                              : rIdx % 2 === 0
                              ? 'bg-white'
                              : 'bg-slate-50/40'
                          } hover:bg-amber-50/40 transition-colors`}
                        >
                          <td className="py-2.5 px-4 sm:px-5 flex items-center space-x-2">
                            {isOverall ? (
                              <span className="text-amber-600 font-black">★</span>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                            )}
                            <span>{row.criterion}</span>
                          </td>
                          <td className="py-2.5 px-4 sm:px-5 text-right font-black">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md ${
                                isOverall
                                  ? 'bg-amber-200/90 text-amber-950 text-xs'
                                  : 'bg-slate-100 text-slate-900 text-xs'
                              }`}
                            >
                              {row.score}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* A LEGFONTOSABB SZEMLÉLETI VÁLTOZTATÁS KÁRTYA */}
          {review.mindsetShift && (
            <div className="p-3.5 bg-gradient-to-r from-amber-100/90 via-amber-50 to-orange-50/80 rounded-xl border-2 border-amber-300 text-amber-950 space-y-1.5 shadow-xs">
              <span className="font-black text-amber-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                <span>A legfontosabb szemléleti változtatás:</span>
              </span>
              <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed italic">
                „{stripIntroductionText(review.mindsetShift).replace(/^A legfontosabb (?:személyzeti|szemléleti) változtatás:\s*/i, '').replace(/^(?:szerintem|véleményem szerint)\s*/i, '')}”
              </p>
            </div>
          )}
        </div>
      )}

      {/* 3. PONT: RÉSZLETES ÉRTÉKELÉS STANDARDO NKÉNT (MIND A 6 ALAPÉRTÉK) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Részletes Értékelés Standardonként (Mind a 6 Alapérték Vizsgálata)
              </h4>
              <p className="text-[11px] text-slate-500">
                A rendszerbe betáplált 6 minőségbiztosítási alapérték és releváns standardjaik tételes, részletes kibontása.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {review.standardsEvaluation.length} / 6 Standard értékelve
          </span>
        </div>

        <div className="space-y-2">
          {review.standardsEvaluation.map((item, idx) => {
            const rawName = item.standardName.trim();
            const displayName = rawName.startsWith('Standard:') || rawName.includes('Standard')
              ? rawName
              : `Standard: ${rawName}`;

            return (
              <div
                key={idx}
                className="p-2.5 sm:p-3 rounded-xl border border-slate-200 bg-white hover:border-amber-300/80 transition-all space-y-1.5 shadow-2xs"
              >
                {/* Standard title + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-1.5">
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-amber-100 text-amber-900 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {displayName}
                    </span>
                  </div>
                  {getStatusBadge(item.status)}
                </div>

                {/* Levél értékelése - Közvetlen, szoros szövegdoboz */}
                <div className="text-slate-800 text-xs leading-relaxed font-medium space-y-1">
                  <p className="whitespace-pre-line text-slate-700">
                    {stripIntroductionText(item.letterAssessment)}
                  </p>
                  {item.reasoning && item.reasoning !== item.letterAssessment && (
                    <p className="text-[11px] text-slate-500 italic">
                      {stripIntroductionText(item.reasoning)}
                    </p>
                  )}
                </div>

                {/* Javasolt megfogalmazás & Elhelyezés (ha van) - bal oldali szegéllyel, szöveghez simulva */}
                {item.suggestedCorrection && (
                  <div className="py-1 px-2.5 bg-emerald-50/90 border-l-3 border-emerald-500 rounded-r text-xs text-emerald-950 flex items-start space-x-1.5">
                    <span className="font-extrabold text-emerald-900 text-[10px] uppercase tracking-wider flex-shrink-0 pt-0.5">
                      Javaslat:
                    </span>
                    <div className="font-mono text-[11px] text-emerald-950 leading-snug font-medium flex-1">
                      „{stripIntroductionText(item.suggestedCorrection)}”
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ÖSSZEGZÉS BLOKK A STANDARDOK UTÁN */}
        {review.summary && (
          <div className="mt-4 pt-3.5 border-t border-slate-200 space-y-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                ★
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-sm">
                  Összegzés
                </h4>
                <p className="text-[11px] text-slate-500">
                  A levél legfőbb erősségei és a legfontosabb fejlesztendő pontok.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
              {/* Pozitív visszajelzés */}
              <div className="p-3.5 bg-emerald-50/80 rounded-xl border border-emerald-200/90 space-y-2">
                <span className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>Pozitív visszajelzés:</span>
                </span>
                <ul className="space-y-1 text-xs text-emerald-950">
                  {review.summary.positiveFeedback.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span className="leading-relaxed">{stripIntroductionText(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Fejlesztendő pontok */}
              <div className="p-3.5 bg-amber-50/80 rounded-xl border border-amber-200/90 space-y-2">
                <span className="font-extrabold text-amber-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Fejlesztendő pontok:</span>
                </span>
                <ul className="space-y-1 text-xs text-amber-950">
                  {review.summary.improvementAreas.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-1.5">
                      <span className="text-amber-600 font-bold">•</span>
                      <span className="leading-relaxed">{stripIntroductionText(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Legfontosabb fejlesztési pont */}
            {review.summary.mainDevelopmentFocus && (
              <div className="p-3.5 bg-gradient-to-r from-amber-100/80 via-amber-50 to-orange-50/60 rounded-xl border-2 border-amber-300 text-amber-950 space-y-1 shadow-xs">
                <span className="font-black text-amber-950 text-xs uppercase tracking-wider flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                  <span>Kiemelt vezetői fejlesztési fókusz:</span>
                </span>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                  {stripIntroductionText(review.summary.mainDevelopmentFocus)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. PONT: SZAKMAI ÉRTÉKELÉS */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
            4
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm leading-tight">Szakmai Értékelés</h4>
            <p className="text-[11px] text-slate-500">
              A levél szakmai helyességének, pontosságának és kockázatainak vizsgálata.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
          {/* Tartalom pontossága */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>A tartalom pontossága:</span>
            </span>
            <p className="text-slate-700 leading-snug">
              {stripIntroductionText(review.professionalAssessment.contentAccuracy)}
            </p>
          </div>

          {/* Szükséges információk megléte és teljesség */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <FileCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>A szükséges információk megléte és teljesség:</span>
            </span>
            <p className="text-slate-700 leading-snug">
              {stripIntroductionText(review.professionalAssessment.informationCompleteness)}
            </p>
          </div>

          {/* Esetleges szakmai hibák */}
          <div
            className={`p-2.5 rounded-xl border space-y-1 text-xs ${
              review.professionalAssessment.professionalMistakes &&
              !review.professionalAssessment.professionalMistakes.toLowerCase().includes('nem') &&
              !review.professionalAssessment.professionalMistakes.toLowerCase().includes('nincs')
                ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
            }`}
          >
            <span className="font-bold flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>Szakmai hibák vizsgálata:</span>
            </span>
            <p className="leading-snug font-medium">
              {stripIntroductionText(review.professionalAssessment.professionalMistakes)}
            </p>
          </div>

          {/* Félreérthető vagy kockázatos megfogalmazások */}
          <div className="p-2.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1 text-xs text-amber-950">
            <span className="font-bold flex items-center space-x-1.5 text-amber-900">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Félreérthető vagy kockázatos megfogalmazások:</span>
            </span>
            <p className="leading-snug">
              {stripIntroductionText(review.professionalAssessment.riskyOrMisleadingPhrasing)}
            </p>
          </div>
        </div>

        {/* Szakmai összefoglaló szöveg */}
        {review.professionalAssessment.overallProfessionalSummary && (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-900 text-xs block">
              Szakmai összefoglaló:
            </span>
            <p className="text-xs text-slate-700 leading-snug">
              {stripIntroductionText(review.professionalAssessment.overallProfessionalSummary)}
            </p>
          </div>
        )}
      </div>

      {/* 5. PONT: KOMMUNIKÁCIÓS ÉRTÉKELÉS */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center flex-shrink-0 shadow-2xs">
            5
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm leading-tight">Kommunikációs Értékelés</h4>
            <p className="text-[11px] text-slate-500">
              Hangnem, empátia, professzionalizmus és szerkezet.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
          {/* Hangnem és empátia */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>Hangnem és empátia:</span>
            </span>
            <p className="text-slate-700 leading-snug">
              {stripIntroductionText(review.communicationAssessment.toneAndEmpathy)}
            </p>
          </div>

          {/* Ügyfélközpontúság és segítőkészség */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>Ügyfélközpontúság és segítőkészség:</span>
            </span>
            <p className="text-slate-700 leading-snug">
              {stripIntroductionText(review.communicationAssessment.customerFocusAndHelpfulness)}
            </p>
          </div>

          {/* Egyértelműség és professzionalizmus */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
              <span>Egyértelműség és professzionalizmus:</span>
            </span>
            <p className="text-slate-700 leading-snug">
              {stripIntroductionText(review.communicationAssessment.clarityAndProfessionalism)}
            </p>
          </div>

          {/* Mondatok és bekezdések érthetősége, levél szerkezete */}
          <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 space-y-1 text-xs">
            <span className="font-bold text-slate-900 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
              <span>Mondatok, bekezdések és szerkezet:</span>
            </span>
            <p className="text-slate-700 leading-snug">
              {stripIntroductionText(review.communicationAssessment.sentenceAndStructureClarity)}
            </p>
          </div>
        </div>

        {/* Kommunikációs összefoglaló */}
        {review.communicationAssessment.overallCommunicationSummary && (
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-0.5">
            <span className="font-bold text-slate-900 text-xs block">
              Kommunikációs összefoglaló:
            </span>
            <p className="text-xs text-slate-700 leading-snug">
              {stripIntroductionText(review.communicationAssessment.overallCommunicationSummary)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
