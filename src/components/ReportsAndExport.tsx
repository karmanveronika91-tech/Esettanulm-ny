import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { CaseStudy, Submission } from '../types';
import { PANNONJOB_DEPARTMENTS } from '../data/pannonjobDepartments';
import {
  BarChart3,
  Download,
  Filter,
  Search,
  Calendar,
  Building,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Award,
  FileSpreadsheet,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Eye,
  FileCheck,
} from 'lucide-react';

interface ReportsAndExportProps {
  submissions: Submission[];
  caseStudies: CaseStudy[];
  departments?: string[];
  onViewSubmission: (sub: Submission) => void;
}

export const ReportsAndExport: React.FC<ReportsAndExportProps> = ({
  submissions,
  caseStudies,
  departments,
  onViewSubmission,
}) => {
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | '90d' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Table view sub-tab
  const [activeReportTab, setActiveReportTab] = useState<'employees' | 'departments' | 'cases'>('employees');

  // Sorting for the employee table
  const [sortBy, setSortBy] = useState<'submittedAt' | 'overallScore' | 'colleagueName'>('submittedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Distinct departments
  const allDepartments = useMemo(() => {
    const baseList = departments && departments.length > 0 ? departments : Array.from(PANNONJOB_DEPARTMENTS);
    const fromSubs = submissions.map((s) => s.department).filter(Boolean);
    return Array.from(new Set([...baseList, ...fromSubs]));
  }, [submissions, departments]);

  // Filter submissions based on all criteria
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      // 1. Department filter
      if (selectedDepartment !== 'all' && sub.department !== selectedDepartment) {
        return false;
      }

      // 2. Case study filter
      if (selectedCaseId !== 'all' && sub.caseStudyId !== selectedCaseId) {
        return false;
      }

      // 3. Status filter
      if (selectedStatus === 'approved_accepted') {
        if (sub.status !== 'approved' && sub.status !== 'accepted') return false;
      } else if (selectedStatus === 'pending') {
        if (sub.status !== 'pending_review') return false;
      } else if (selectedStatus === 'redo') {
        if (sub.status !== 'redo_required' && sub.status !== 'redo_requested' && sub.overallScore >= 75) return false;
      } else if (selectedStatus === 'passed') {
        if (sub.overallScore < 75) return false;
      } else if (selectedStatus === 'failed') {
        if (sub.overallScore >= 75) return false;
      }

      // 4. Time range filter
      if (timeRange !== 'all') {
        const subDate = new Date(sub.submittedAt).getTime();
        const now = Date.now();

        if (timeRange === '7d' && now - subDate > 7 * 24 * 3600 * 1000) return false;
        if (timeRange === '30d' && now - subDate > 30 * 24 * 3600 * 1000) return false;
        if (timeRange === '90d' && now - subDate > 90 * 24 * 3600 * 1000) return false;
        if (timeRange === 'custom') {
          if (customStartDate && new Date(sub.submittedAt) < new Date(customStartDate)) return false;
          if (customEndDate) {
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            if (new Date(sub.submittedAt) > end) return false;
          }
        }
      }

      // 5. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = sub.colleagueName?.toLowerCase().includes(query);
        const matchEmail = sub.colleagueEmail?.toLowerCase().includes(query);
        const matchCase = sub.caseStudyTitle?.toLowerCase().includes(query);
        const matchDept = sub.department?.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchCase && !matchDept) return false;
      }

      return true;
    });
  }, [
    submissions,
    selectedDepartment,
    selectedCaseId,
    selectedStatus,
    timeRange,
    customStartDate,
    customEndDate,
    searchQuery,
  ]);

  // Sorted list for employee report view
  const sortedSubmissions = useMemo(() => {
    return [...filteredSubmissions].sort((a, b) => {
      if (sortBy === 'overallScore') {
        return sortOrder === 'asc' ? a.overallScore - b.overallScore : b.overallScore - a.overallScore;
      }
      if (sortBy === 'colleagueName') {
        return sortOrder === 'asc'
          ? a.colleagueName.localeCompare(b.colleagueName)
          : b.colleagueName.localeCompare(a.colleagueName);
      }
      // default: submittedAt
      const dateA = new Date(a.submittedAt).getTime();
      const dateB = new Date(b.submittedAt).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredSubmissions, sortBy, sortOrder]);

  // Aggregated KPI metrics for the current filtered selection
  const metrics = useMemo(() => {
    const total = filteredSubmissions.length;
    if (total === 0) {
      return {
        total: 0,
        avgOverall: 0,
        avgTask: 0,
        avgEmail: 0,
        passCount: 0,
        failCount: 0,
        pendingCount: 0,
        passRate: 0,
      };
    }

    const sumOverall = filteredSubmissions.reduce((acc, s) => acc + (s.overallScore || 0), 0);
    const sumTask = filteredSubmissions.reduce((acc, s) => acc + (s.taskScore || 0), 0);
    const sumEmail = filteredSubmissions.reduce((acc, s) => acc + (s.emailScore || 0), 0);
    const passCount = filteredSubmissions.filter((s) => s.overallScore >= 75 && s.taskScore >= 75 && s.emailScore >= 75).length;
    const failCount = filteredSubmissions.filter(
      (s) => s.overallScore < 75 || s.taskScore < 75 || s.emailScore < 75 || s.status === 'redo_required'
    ).length;
    const pendingCount = filteredSubmissions.filter((s) => s.status === 'pending_review').length;

    return {
      total,
      avgOverall: Math.round(sumOverall / total),
      avgTask: Math.round(sumTask / total),
      avgEmail: Math.round(sumEmail / total),
      passCount,
      failCount,
      pendingCount,
      passRate: Math.round((passCount / total) * 100),
    };
  }, [filteredSubmissions]);

  // Department Aggregated Summary
  const departmentStats = useMemo(() => {
    const deptMap = new Map<
      string,
      {
        department: string;
        count: number;
        totalTask: number;
        totalEmail: number;
        totalOverall: number;
        passCount: number;
        failCount: number;
      }
    >();

    filteredSubmissions.forEach((sub) => {
      const dept = sub.department || 'Egyéb / Ismeretlen';
      const existing = deptMap.get(dept) || {
        department: dept,
        count: 0,
        totalTask: 0,
        totalEmail: 0,
        totalOverall: 0,
        passCount: 0,
        failCount: 0,
      };

      existing.count += 1;
      existing.totalTask += sub.taskScore || 0;
      existing.totalEmail += sub.emailScore || 0;
      existing.totalOverall += sub.overallScore || 0;
      if (sub.overallScore >= 75 && sub.taskScore >= 75 && sub.emailScore >= 75) {
        existing.passCount += 1;
      } else {
        existing.failCount += 1;
      }

      deptMap.set(dept, existing);
    });

    return Array.from(deptMap.values()).map((d) => ({
      department: d.department,
      count: d.count,
      avgTask: Math.round(d.totalTask / d.count),
      avgEmail: Math.round(d.totalEmail / d.count),
      avgOverall: Math.round(d.totalOverall / d.count),
      passCount: d.passCount,
      failCount: d.failCount,
      passRate: Math.round((d.passCount / d.count) * 100),
    }));
  }, [filteredSubmissions]);

  // Case Study Aggregated Summary
  const caseStudyStats = useMemo(() => {
    const caseMap = new Map<
      string,
      {
        id: string;
        title: string;
        count: number;
        totalTask: number;
        totalEmail: number;
        totalOverall: number;
        minScore: number;
        maxScore: number;
        passCount: number;
      }
    >();

    filteredSubmissions.forEach((sub) => {
      const caseId = sub.caseStudyId || 'unknown';
      const caseTitle = sub.caseStudyTitle || 'Ismeretlen eset';
      const existing = caseMap.get(caseId) || {
        id: caseId,
        title: caseTitle,
        count: 0,
        totalTask: 0,
        totalEmail: 0,
        totalOverall: 0,
        minScore: 100,
        maxScore: 0,
        passCount: 0,
      };

      existing.count += 1;
      existing.totalTask += sub.taskScore || 0;
      existing.totalEmail += sub.emailScore || 0;
      existing.totalOverall += sub.overallScore || 0;
      existing.minScore = Math.min(existing.minScore, sub.overallScore || 0);
      existing.maxScore = Math.max(existing.maxScore, sub.overallScore || 0);
      if (sub.overallScore >= 75) {
        existing.passCount += 1;
      }

      caseMap.set(caseId, existing);
    });

    return Array.from(caseMap.values()).map((c) => ({
      id: c.id,
      title: c.title,
      count: c.count,
      avgTask: Math.round(c.totalTask / c.count),
      avgEmail: Math.round(c.totalEmail / c.count),
      avgOverall: Math.round(c.totalOverall / c.count),
      minScore: c.minScore === 100 && c.count === 0 ? 0 : c.minScore,
      maxScore: c.maxScore,
      passRate: Math.round((c.passCount / c.count) * 100),
    }));
  }, [filteredSubmissions]);

  // Export to Multi-Sheet Excel Workbook
  const handleExportToExcel = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // 1. Sheet: Detailed Employee Submissions
      const employeeData = filteredSubmissions.map((sub, index) => {
        let statusLabel = 'Vezetői jóváhagyásra vár';
        if (sub.status === 'approved') statusLabel = 'Vezető jóváhagyta (Döntésre vár)';
        if (sub.status === 'accepted') statusLabel = 'Elfogadva';
        if (sub.status === 'redo_required') statusLabel = '75% alatti (Újradolgozandó)';
        if (sub.status === 'redo_requested') statusLabel = 'Újradolgozás kérve';

        const isPass = sub.overallScore >= 75 && sub.taskScore >= 75 && sub.emailScore >= 75;

        return {
          'Sorszám': index + 1,
          'Munkatárs Neve': sub.colleagueName,
          'E-mail Címe': sub.colleagueEmail,
          'Munkaterület / Részleg': sub.department,
          'Esettanulmány Címe': sub.caseStudyTitle,
          'Beküldés Dátuma': new Date(sub.submittedAt).toLocaleString('hu-HU'),
          'Feladatkidolgozás (%)': sub.taskScore,
          'Feladat Minősítés': sub.taskEvaluation?.overallTaskRating || (sub.taskScore >= 75 ? 'Megfelelt' : 'Újradolgozandó'),
          'Tájékoztató Levél (%)': sub.emailScore,
          'Levél Minősítés': sub.emailEvaluation?.overallEmailRating || (sub.emailScore >= 75 ? 'Megfelelt' : 'Újradolgozandó'),
          'Összeredmény (%)': sub.overallScore,
          'Megfelelt (>=75%)': isPass ? 'IGEN (Megfelelt)' : 'NEM (Újradolgozandó)',
          'Státusz': statusLabel,
          'Értékelő Vezető': sub.reviewedBy || '-',
          'Jóváhagyás Dátuma': sub.reviewedAt ? new Date(sub.reviewedAt).toLocaleString('hu-HU') : '-',
          'Vezetői Megjegyzés': sub.managerNotes || '-',
        };
      });

      // 2. Sheet: Department Summary
      const departmentData = departmentStats.map((d) => ({
        'Munkaterület / Részleg': d.department,
        'Beküldések Száma (db)': d.count,
        'Átlagos Feladatkidolgozás (%)': d.avgTask,
        'Átlagos Tájékoztató Levél (%)': d.avgEmail,
        'Átlagos Összeredmény (%)': d.avgOverall,
        'Megfelelési Arány (%)': `${d.passRate}%`,
        'Megfelelt Beküldések (db)': d.passCount,
        'Újradolgozandó Beküldések (db)': d.failCount,
      }));

      // 3. Sheet: Case Study Summary
      const caseData = caseStudyStats.map((c) => ({
        'Esettanulmány Címe': c.title,
        'Kitöltések Száma (db)': c.count,
        'Átlagos Feladatkidolgozás (%)': c.avgTask,
        'Átlagos Tájékoztató Levél (%)': c.avgEmail,
        'Átlagos Összeredmény (%)': c.avgOverall,
        'Legjobb Pontszám (%)': c.maxScore,
        'Leggyengébb Pontszám (%)': c.minScore,
        'Megfelelési Arány (%)': `${c.passRate}%`,
      }));

      // Create Workbook and add Sheets
      const wb = XLSX.utils.book_new();

      const wsEmployees = XLSX.utils.json_to_sheet(employeeData);
      XLSX.utils.book_append_sheet(wb, wsEmployees, 'Dolgozói_Riport');

      const wsDepts = XLSX.utils.json_to_sheet(departmentData);
      XLSX.utils.book_append_sheet(wb, wsDepts, 'Területi_Összesítő');

      const wsCases = XLSX.utils.json_to_sheet(caseData);
      XLSX.utils.book_append_sheet(wb, wsCases, 'Esettanulmány_Statisztika');

      // Generate filename with timestamp
      const today = new Date().toISOString().split('T')[0];
      const fileName = `Esettanulmanyok_Riport_${today}.xlsx`;

      // Save workbook file
      XLSX.writeFile(wb, fileName);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      console.error('Excel export error:', err);
      alert('Hiba történt az Excel exportálása során.');
    } finally {
      setIsExporting(false);
    }
  };

  const resetFilters = () => {
    setSelectedDepartment('all');
    setSelectedCaseId('all');
    setSelectedStatus('all');
    setTimeRange('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearchQuery('');
  };

  const isFilterActive =
    selectedDepartment !== 'all' ||
    selectedCaseId !== 'all' ||
    selectedStatus !== 'all' ||
    timeRange !== 'all' ||
    searchQuery.trim() !== '';

  return (
    <div className="space-y-6">
      {/* Header & Export Hero */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-md border border-amber-200">
              Vezetői & HR Analitika
            </span>
            <span className="text-xs text-slate-400 font-medium">Komplex Riporting Modul</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2.5">
            <BarChart3 className="w-7 h-7 text-amber-600" />
            <span>Esettanulmány Teljesítmény Riportok & Excel Export</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Munkaterület, esettanulmány és státusz szerinti szűrés, összehasonlító elemzés és 1-kattintásos komplex Excel (.xlsx) exportálás.
          </p>
        </div>

        {/* Action button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={handleExportToExcel}
            disabled={isExporting || filteredSubmissions.length === 0}
            className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>{isExporting ? 'Excel generálása...' : 'Excel Riport Letöltése (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-3 text-emerald-900 text-xs sm:text-sm font-bold shadow-sm animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>
            Az Excel fájl sikeresen legenerálva és letöltve 3 részletes munkalappal (Dolgozói Riport, Területi Összesítő, Esettanulmány Statisztika)!
          </span>
        </div>
      )}

      {/* Multi-Dimensional Filter Control Bar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>Riport Szűrők & Paraméterek</span>
          </div>

          {isFilterActive && (
            <button
              onClick={resetFilters}
              className="text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Szűrők Alaphelyzetbe</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Department Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Munkaterület / Részleg:</span>
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
            >
              <option value="all">📍 Minden terület ({submissions.length} eset)</option>
              {allDepartments.map((dept) => {
                const count = submissions.filter((s) => s.department === dept).length;
                return (
                  <option key={dept} value={dept}>
                    {dept} ({count} db)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 2. Case Study Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Esettanulmány Témája:</span>
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
            >
              <option value="all">📚 Minden esettanulmány</option>
              {caseStudies.map((cs) => {
                const count = submissions.filter((s) => s.caseStudyId === cs.id).length;
                return (
                  <option key={cs.id} value={cs.id}>
                    {cs.title} ({count} db)
                  </option>
                );
              })}
            </select>
          </div>

          {/* 3. Status Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Eredmény & Státusz:</span>
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Minden státusz</option>
              <option value="passed">✅ Megfelelt (≥ 75%)</option>
              <option value="failed">⚠️ 75% alatti / Nem felelt meg</option>
              <option value="approved_accepted">👔 Vezető által Jóváhagyva / Elfogadva</option>
              <option value="pending">⏳ Vezetői jóváhagyásra vár</option>
              <option value="redo">🔄 Újradolgozandó / Kérve</option>
            </select>
          </div>

          {/* 4. Time Range Filter */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Időszak:</span>
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-amber-500 focus:bg-white cursor-pointer"
            >
              <option value="all">Teljes időszak</option>
              <option value="7d">Elmúlt 7 nap</option>
              <option value="30d">Elmúlt 30 nap</option>
              <option value="90d">Elmúlt 90 nap</option>
              <option value="custom">Egyéni dátum-tartomány...</option>
            </select>
          </div>
        </div>

        {/* Optional Custom Date Range Inputs */}
        {timeRange === 'custom' && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-600">Kezdő dátum:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-medium"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-600">Záró dátum:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-medium"
              />
            </div>
          </div>
        )}

        {/* Text Search Bar */}
        <div className="relative pt-2">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szűrés munkatárs nevére, e-mail címére, részlegre..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-amber-500 focus:bg-white"
          />
        </div>
      </div>

      {/* KPI & Summary Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Metric 1 */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Szűrt Beküldések</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-slate-900">{metrics.total}</span>
            <span className="text-xs text-slate-400 font-medium">eset</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {metrics.pendingCount > 0 ? `${metrics.pendingCount} db jóváhagyásra vár` : 'Minden beküldés feldolgozva'}
          </span>
        </div>

        {/* Metric 2 */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">1. Feladatkidolgozás</span>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-3xl font-black ${
                metrics.avgTask >= 75 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {metrics.avgTask}%
            </span>
            <span className="text-xs text-slate-400 font-medium">átlag</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Szakmai és jogi pontosság</span>
        </div>

        {/* Metric 3 */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">2. Tájékoztató Levél</span>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-3xl font-black ${
                metrics.avgEmail >= 75 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {metrics.avgEmail}%
            </span>
            <span className="text-xs text-slate-400 font-medium">átlag</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Ügyfélszolgálati kommunikáció</span>
        </div>

        {/* Metric 4 */}
        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-3xl border border-amber-300 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-amber-950 uppercase block">Súlyozott Összeredmény</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-amber-900">{metrics.avgOverall}%</span>
            <span className="text-xs font-bold text-amber-800">
              {metrics.avgOverall >= 75 ? 'Megfelelt' : 'Fejlesztendő'}
            </span>
          </div>
          <span className="text-[10px] text-amber-800 block">Együttes átlagteljesítmény</span>
        </div>

        {/* Metric 5 */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-1 col-span-2 lg:col-span-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase block">Megfelelési Arány</span>
          <div className="flex items-baseline space-x-2">
            <span
              className={`text-3xl font-black ${
                metrics.passRate >= 80 ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {metrics.passRate}%
            </span>
            <span className="text-xs text-slate-500 font-bold">
              ({metrics.passCount}/{metrics.total})
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
            <div
              className={`h-full ${metrics.passRate >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${metrics.passRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Multi-Tab Detailed Data Views */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Navigation Tabs for Reports */}
        <div className="flex flex-wrap items-center justify-between p-4 sm:px-6 border-b border-slate-200 bg-slate-50 gap-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveReportTab('employees')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeReportTab === 'employees'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Dolgozói Eredménylista ({sortedSubmissions.length})</span>
            </button>

            <button
              onClick={() => setActiveReportTab('departments')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeReportTab === 'departments'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Területi / Részleg Kimutatás ({departmentStats.length})</span>
            </button>

            <button
              onClick={() => setActiveReportTab('cases')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                activeReportTab === 'cases'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Esettanulmány Elemzés ({caseStudyStats.length})</span>
            </button>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {filteredSubmissions.length} találat az aktív szűrés alapján
          </span>
        </div>

        {/* Tab 1: Employee Submissions Table */}
        {activeReportTab === 'employees' && (
          <div className="overflow-x-auto">
            {sortedSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-sm">Nincs a megadott szűrésnek megfelelő beküldés.</p>
                <p className="text-xs text-slate-400">Próbáld meg módosítani vagy törölni a szűrőket!</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-extrabold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => {
                        if (sortBy === 'colleagueName') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('colleagueName');
                          setSortOrder('asc');
                        }
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Munkatárs</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Munkaterület</th>
                    <th className="py-3.5 px-4">Esettanulmány</th>
                    <th
                      className="py-3.5 px-4 cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => {
                        if (sortBy === 'submittedAt') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('submittedAt');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Beküldve</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-3 text-center">1. Feladat</th>
                    <th className="py-3.5 px-3 text-center">2. Levél</th>
                    <th
                      className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-200 transition-colors"
                      onClick={() => {
                        if (sortBy === 'overallScore') {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy('overallScore');
                          setSortOrder('desc');
                        }
                      }}
                    >
                      <div className="flex items-center justify-center space-x-1">
                        <span>Összesen</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3.5 px-4">Státusz</th>
                    <th className="py-3.5 px-4 text-right">Művelet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedSubmissions.map((sub) => {
                    const isPass = sub.overallScore >= 75 && sub.taskScore >= 75 && sub.emailScore >= 75;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{sub.colleagueName}</div>
                          <div className="text-[11px] text-slate-400">{sub.colleagueEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium text-[11px]">
                            {sub.department}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-[200px]">
                          <span className="font-medium text-slate-800 line-clamp-1" title={sub.caseStudyTitle}>
                            {sub.caseStudyTitle}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(sub.submittedAt).toLocaleDateString('hu-HU', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`font-black ${
                              sub.taskScore >= 75 ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {sub.taskScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`font-black ${
                              sub.emailScore >= 75 ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {sub.emailScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg font-black ${
                              isPass ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'
                            }`}
                          >
                            {sub.overallScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {sub.status === 'pending_review' && (
                            <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 inline-flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              <span>Jóváhagyásra vár</span>
                            </span>
                          )}
                          {sub.status === 'approved' && (
                            <span className="bg-blue-100 text-blue-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                              Jóváhagyva (Döntésre vár)
                            </span>
                          )}
                          {sub.status === 'accepted' && (
                            <span className="bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ Elfogadva
                            </span>
                          )}
                          {sub.status === 'redo_required' && (
                            <span className="bg-red-100 text-red-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                              ⚠️ Újradolgozandó
                            </span>
                          )}
                          {sub.status === 'redo_requested' && (
                            <span className="bg-orange-100 text-orange-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-orange-200">
                              🔄 Újradolgozás alatt
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onViewSubmission(sub)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-amber-400" />
                            <span>Megtekintés</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Department Level Aggregations */}
        {activeReportTab === 'departments' && (
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentStats.map((d) => (
                <div
                  key={d.department}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                      <Building className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>{d.department}</span>
                    </h3>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      {d.count} beküldés
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">1. Feladat</span>
                      <span className="text-lg font-black text-slate-800">{d.avgTask}%</span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">2. Levél</span>
                      <span className="text-lg font-black text-slate-800">{d.avgEmail}%</span>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                      <span className="text-[10px] text-amber-900 font-bold block">Összesen</span>
                      <span className="text-lg font-black text-amber-950">{d.avgOverall}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">Megfelelési arány:</span>
                    <span
                      className={`font-black ${
                        d.passRate >= 75 ? 'text-emerald-700' : 'text-red-600'
                      }`}
                    >
                      {d.passRate}% ({d.passCount} megfelelt / {d.failCount} fejlesztendő)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Case Study Level Aggregations */}
        {activeReportTab === 'cases' && (
          <div className="p-6 space-y-4">
            <div className="space-y-3">
              {caseStudyStats.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                        {c.count} kitöltés
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Feladat Átlag</span>
                      <span className="font-black text-slate-800">{c.avgTask}%</span>
                    </div>

                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Levél Átlag</span>
                      <span className="font-black text-slate-800">{c.avgEmail}%</span>
                    </div>

                    <div className="bg-amber-100 text-amber-950 px-3.5 py-1.5 rounded-xl border border-amber-300 text-center">
                      <span className="text-[10px] text-amber-900 block font-bold">Összeredmény</span>
                      <span className="font-black text-amber-950 text-sm">{c.avgOverall}%</span>
                    </div>

                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-center">
                      <span className="text-[10px] text-slate-400 block font-bold">Sikeres Arány</span>
                      <span className="font-black text-emerald-700">{c.passRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
