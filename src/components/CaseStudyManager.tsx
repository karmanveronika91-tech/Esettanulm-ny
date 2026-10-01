import React, { useState } from 'react';
import { CaseStudy } from '../types';
import {
  Plus,
  BookOpen,
  Shield,
  Search,
  Trash2,
  Edit3,
  Check,
  FileText,
  X,
  Mail,
  Copy,
  Scale,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface CaseStudyManagerProps {
  caseStudies: CaseStudy[];
  onAddCaseStudy: (caseStudy: CaseStudy) => void;
  onUpdateCaseStudy: (caseStudy: CaseStudy) => void;
  onDeleteCaseStudy: (id: string) => void;
  onSelectForEvaluation: (id: string) => void;
}

export const CaseStudyManager: React.FC<CaseStudyManagerProps> = ({
  caseStudies,
  onAddCaseStudy,
  onUpdateCaseStudy,
  onDeleteCaseStudy,
  onSelectForEvaluation,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(caseStudies[0]?.id || null);
  const [showSolutionMap, setShowSolutionMap] = useState<Record<string, boolean>>({});
  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [editingCase, setEditingCase] = useState<CaseStudy | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Munkajog & Külföldi munkavállalók');
  const [description, setDescription] = useState('');
  const [taskQuestions, setTaskQuestions] = useState('');
  const [communicationFocus, setCommunicationFocus] = useState('');
  const [solutionGuide, setSolutionGuide] = useState('');
  const [sampleEmailTemplate, setSampleEmailTemplate] = useState('');
  const [legalAndForms, setLegalAndForms] = useState('');

  const filteredCaseStudies = caseStudies.filter(
    (cs) =>
      cs.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cs.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCase = caseStudies.find((c) => c.id === selectedCaseId) || caseStudies[0];

  const toggleSolution = (id: string) => {
    setShowSolutionMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const openCreateModal = () => {
    setEditingCase(null);
    setTitle('');
    setCategory('Munkajog & Külföldi munkavállalók');
    setDescription('');
    setTaskQuestions('1. Hazautazhat-e a munkavállaló?\n2. Milyen szabályokra kell figyelni?\n3. Milyen nyomtatványokat kell kitölteni?\n4. Mely jogszabályok irányadók?');
    setCommunicationFocus('Címzett: Munkavállaló / Partner\nFókusz: Közérthető tájékoztatás és egyértelmű határidők.');
    setSolutionGuide('');
    setSampleEmailTemplate('');
    setLegalAndForms('');
    setIsCreatingModal(true);
  };

  const openEditModal = (caseToEdit: CaseStudy) => {
    setEditingCase(caseToEdit);
    setTitle(caseToEdit.title);
    setCategory(caseToEdit.category);
    setDescription(caseToEdit.description);
    setTaskQuestions(caseToEdit.taskQuestions);
    setCommunicationFocus(caseToEdit.communicationFocus);
    setSolutionGuide(caseToEdit.solutionGuide || '');
    setSampleEmailTemplate(caseToEdit.sampleEmailTemplate || '');
    setLegalAndForms(caseToEdit.legalAndForms || '');
    setIsCreatingModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    if (editingCase) {
      const updated: CaseStudy = {
        ...editingCase,
        title,
        category,
        description,
        taskQuestions,
        communicationFocus,
        solutionGuide,
        sampleEmailTemplate,
        legalAndForms,
      };
      onUpdateCaseStudy(updated);
      setSelectedCaseId(updated.id);
    } else {
      const nextNumber = caseStudies.length + 1;
      const newCase: CaseStudy = {
        id: `custom-${Date.now()}`,
        caseNumber: nextNumber,
        title,
        category,
        description,
        taskQuestions,
        communicationFocus,
        solutionGuide,
        sampleEmailTemplate,
        legalAndForms,
        isDefault: false,
      };
      onAddCaseStudy(newCase);
      setSelectedCaseId(newCase.id);
    }

    setIsCreatingModal(false);
    setEditingCase(null);
  };

  const handleCopySampleEmail = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-amber-600" />
            <span>Esettanulmány & Sablonlevél Könyvtár</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kezeld az esettanulmányokat, add meg a feladatok helyes megoldási kulcsát és az etalon sablon leveleket az AI értékeléshez.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Új Esettanulmány Létrehozása</span>
        </button>
      </div>

      {/* Main Grid: Case List vs Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List & Search */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Keresés az esettanulmányok között..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="space-y-2 max-h-[650px] overflow-y-auto pr-1">
            {filteredCaseStudies.map((cs, idx) => {
              const num = cs.caseNumber || idx + 1;
              return (
                <div
                  key={cs.id}
                  onClick={() => setSelectedCaseId(cs.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    selectedCaseId === cs.id
                      ? 'border-amber-500 bg-amber-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center space-x-1.5 font-bold text-slate-900 text-sm">
                      <span className="px-2 py-0.5 bg-slate-900 text-amber-400 rounded-md text-xs font-black">
                        #{num}
                      </span>
                      <span>{cs.title}</span>
                    </div>
                    {cs.isDefault && (
                      <span className="text-[10px] font-bold bg-amber-200 text-slate-900 px-2 py-0.5 rounded-full flex-shrink-0">
                        Alapértelmezett
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block font-medium mb-1.5">{cs.category}</span>
                  
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-semibold mb-2">
                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      Feladat kulcs
                    </span>
                    {cs.sampleEmailTemplate && (
                      <span className="bg-amber-100/70 text-amber-950 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-amber-700" />
                        Sablon levél megadva
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 line-clamp-2 leading-relaxed">{cs.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed View */}
        {activeCase ? (
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 bg-slate-900 text-amber-400 font-black rounded-lg text-xs">
                    #{activeCase.caseNumber || caseStudies.findIndex(c => c.id === activeCase.id) + 1}. Esettanulmány
                  </span>
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                    {activeCase.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-2">{activeCase.title}</h2>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => openEditModal(activeCase)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  title="Szerkesztés"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Szerkesztés</span>
                </button>

                <button
                  onClick={() => onSelectForEvaluation(activeCase.id)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kiválasztás Értékeléshez</span>
                </button>

                {!activeCase.isDefault && (
                  <button
                    onClick={() => onDeleteCaseStudy(activeCase.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Törlés"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Content Sections */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1.5">Esetleírás (Tényállás):</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-line">
                  {activeCase.description}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 text-amber-900 flex items-center space-x-1.5">
                    <span>📋 1. Feladat / Kérdések (Munkatárs látja):</span>
                  </h3>
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/60 text-slate-800 leading-relaxed whitespace-pre-line">
                    {activeCase.taskQuestions}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1.5 text-blue-900 flex items-center space-x-1.5">
                    <span>✉️ 2. Tájékoztató Levél Feladat (Munkatárs látja):</span>
                  </h3>
                  <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-200/60 text-slate-800 leading-relaxed">
                    Készíts egy professzionális, ügyfélközpontú tájékoztató levelet (e-mailt) a helyzet kezelésére. A pontos etalon mintalevelet és a megoldási kulcsot a rejtett vezetői szekció tartalmazza.
                  </div>
                </div>
              </div>

              {/* Secret Reference Solution Guide */}
              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => toggleSolution(activeCase.id)}
                  className="w-full text-left p-3.5 bg-gradient-to-r from-amber-100/90 to-amber-50 hover:bg-amber-100 text-amber-950 font-bold rounded-xl border-2 border-amber-300 flex items-center justify-between text-xs cursor-pointer transition-colors shadow-sm"
                >
                  <span className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-amber-700" />
                    <span>
                      {showSolutionMap[activeCase.id]
                        ? '🔒 Rejtett Megoldási Kulcs & Sablon Levél Elrejtése'
                        : '🔒 Rejtett Megoldási Kulcs & Sablon Levél Megtekintése (AI & Vezetői Etalon)'}
                    </span>
                  </span>
                  <span>{showSolutionMap[activeCase.id] ? '▲' : '▼'}</span>
                </button>

                {showSolutionMap[activeCase.id] && (
                  <div className="mt-3 p-5 bg-amber-50/90 rounded-2xl border border-amber-300 space-y-4 text-xs">
                    {/* 1. Feladat Megoldási Kulcs */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-extrabold text-amber-950 text-sm flex items-center space-x-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>1. Feladatokra Vonatkozó Helyes Szakmai Megoldás (Vezetői Kulcs):</span>
                        </h4>
                      </div>
                      <p className="text-slate-800 whitespace-pre-line mt-1 leading-relaxed bg-white p-3.5 rounded-xl border border-amber-200">
                        {activeCase.solutionGuide || 'Nincs külön szakmai megoldás rögzítve.'}
                      </p>
                    </div>

                    {/* 2. Elvárt Sablon Levél / Etalon Mintalevél */}
                    <div className="pt-3 border-t border-amber-200">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="font-extrabold text-blue-950 text-sm flex items-center space-x-1.5">
                          <Mail className="w-4 h-4 text-blue-600" />
                          <span>2. Elvárt Sablon Levél / Etalon Minta Tájékoztató (Értékelés Alapja):</span>
                        </h4>
                        {activeCase.sampleEmailTemplate && (
                          <button
                            onClick={() => handleCopySampleEmail(activeCase.sampleEmailTemplate)}
                            className="flex items-center space-x-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded-md border border-amber-300 text-[11px] font-bold cursor-pointer transition-colors"
                          >
                            {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedEmail ? 'Másolva!' : 'Sablon Másolása'}</span>
                          </button>
                        )}
                      </div>
                      <div className="text-slate-800 whitespace-pre-line mt-1 leading-relaxed bg-white p-3.5 rounded-xl border border-amber-200 font-sans">
                        {activeCase.sampleEmailTemplate || 'Nincs külön sablon levél rögzítve. A rendszer a kommunikációs fókuszt használja.'}
                      </div>
                    </div>

                    {/* Kommunikációs fókusz & Jogszabályok */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-amber-200">
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5 mb-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Kommunikációs Fókusz:</span>
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line bg-white/90 p-2.5 rounded-lg border border-amber-200 text-[11px]">
                          {activeCase.communicationFocus}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-bold text-slate-900 text-xs flex items-center space-x-1.5 mb-1">
                          <Scale className="w-3.5 h-3.5 text-amber-600" />
                          <span>Jogszabályi Háttér & Nyomtatványok:</span>
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line bg-white/90 p-2.5 rounded-lg border border-amber-200 text-[11px]">
                          {activeCase.legalAndForms}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-7 bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-500">
            Válassz ki egy esettanulmányt a bal oldali listából.
          </div>
        )}
      </div>

      {/* Modal for Creating / Editing Case Study */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center space-x-2">
                {editingCase ? <Edit3 className="w-5 h-5 text-amber-600" /> : <Plus className="w-5 h-5 text-amber-600" />}
                <span>{editingCase ? 'Esettanulmány & Sablonok Szerkesztése' : 'Új Esettanulmány & Sablonlevél Létrehozása'}</span>
              </h2>
              <button
                onClick={() => setIsCreatingModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-800 mb-1">Esettanulmány Címe *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="pl. Hazautazás a vendégmunkás-engedély hosszabbítása alatt"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Kategória / Szakterület</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Munkajog & Külföldi munkavállalók">Munkajog & Külföldi munkavállalók</option>
                    <option value="Munkajog & Ügyfélszolgálat">Munkajog & Ügyfélszolgálat</option>
                    <option value="Munkaerő-kölcsönzés & Diákmunka">Munkaerő-kölcsönzés & Diákmunka</option>
                    <option value="Toborzás & Kiválasztás">Toborzás & Kiválasztás</option>
                    <option value="Bérszámfejtés & Ügyvitel">Bérszámfejtés & Ügyvitel</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">Esetleírás (Tényállás a munkatárs számára) *</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Írd le az eseményeket, a partner és a munkavállaló helyzetét..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-amber-950 mb-1">
                    📋 Feltett Kérdések a feladatban (Munkatárs látja)
                  </label>
                  <textarea
                    rows={3}
                    value={taskQuestions}
                    onChange={(e) => setTaskQuestions(e.target.value)}
                    placeholder="1. Hazautazhat-e a munkavállaló?&#10;2. Milyen szabályokra kell figyelni?..."
                    className="w-full bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-blue-950 mb-1">
                    ✉️ Kommunikációs Fókusz & Címzett
                  </label>
                  <textarea
                    rows={3}
                    value={communicationFocus}
                    onChange={(e) => setCommunicationFocus(e.target.value)}
                    placeholder="Címzett: Munkavállalók / Partner&#10;Fókusz: Közérthetőség, határozott tiltás..."
                    className="w-full bg-blue-50/50 border border-blue-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
              </div>

              {/* Helyes Megoldási Kulcs Szekció (Kiemelt) */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border-2 border-emerald-300 space-y-2">
                <label className="block font-extrabold text-emerald-950 text-xs flex items-center space-x-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>1. Feladatokra Vonatkozó Helyes Szakmai Megoldás (Szakmai megoldási kulcs)</span>
                </label>
                <p className="text-[11px] text-emerald-800">
                  Ide rögzítsd a feladatkérdésekre adott elvárt, helyes szakmai válaszokat. A rendszer és a vezető ez alapján pontozza a feladatmegoldást (1. dokumentum).
                </p>
                <textarea
                  rows={4}
                  value={solutionGuide}
                  onChange={(e) => setSolutionGuide(e.target.value)}
                  placeholder="pl. A munkavállaló csak érvényes fizikai plasztikkártyával térhet vissza. A papíralapú igazolás belföldi, repülőjegy vásárlási tilalom áll fenn kártya átvételéig..."
                  className="w-full bg-white border border-emerald-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Sablon Levél Szekció (Kiemelt) */}
              <div className="p-4 bg-blue-50/70 rounded-2xl border-2 border-blue-300 space-y-2">
                <label className="block font-extrabold text-blue-950 text-xs flex items-center space-x-1.5">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>2. Elvárt Sablon Levél / Etalon Mintalevél (Értékelési viszonyítási alap)</span>
                </label>
                <p className="text-[11px] text-blue-800">
                  Ide másolj be egy mintalevelet (ideális e-mail választ), amely alapján az applikáció elvégzi a tájékoztató levél tartalmi és ügyfélszolgálati minősítését (2. dokumentum).
                </p>
                <textarea
                  rows={5}
                  value={sampleEmailTemplate}
                  onChange={(e) => setSampleEmailTemplate(e.target.value)}
                  placeholder="Tisztelt Partnereink! / Kedves Munkatársak!&#10;&#10;Ezúton tájékoztatjuk Önöket a legfontosabb teendőkről és szabályokról...&#10;1. Pont...&#10;2. Pont..."
                  className="w-full bg-white border border-blue-300 rounded-xl p-2.5 font-medium font-sans focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  ⚖️ Munkajogi Háttér & Kitöltendő Belső Nyomtatványok
                </label>
                <textarea
                  rows={2}
                  value={legalAndForms}
                  onChange={(e) => setLegalAndForms(e.target.value)}
                  placeholder="Vonatkozó törvények, rendeletek és belső esettanulmány formanyomtatványok..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold shadow-md transition-all cursor-pointer"
                >
                  {editingCase ? 'Változtatások Mentése' : 'Mentés & Esettanulmány Létrehozása'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

