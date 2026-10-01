import React, { useState } from 'react';
import { CaseStudy, Employee, CaseAssignment, UserRole } from '../types';
import { PANNONJOB_DEPARTMENTS } from '../data/pannonjobDepartments';
import { generateDefaultPassword, generateUsername } from '../utils/authUtils';
import { EmployeeTableImportModal } from './EmployeeTableImportModal';
import { DepartmentManager } from './DepartmentManager';
import { downloadEmployeeTemplate } from '../utils/employeeExcelImporter';
import { openMailClient, getPortalUrl } from '../services/notificationService';
import {
  Users,
  User,
  Plus,
  Search,
  Calendar,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  Trash2,
  Edit3,
  Send,
  Sparkles,
  BookOpen,
  Filter,
  FileSpreadsheet,
  Building2,
  Briefcase,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Key,
  RotateCcw,
  Lock,
  Download,
} from 'lucide-react';
import { Submission } from '../types';

interface CaseAssignmentManagerProps {
  caseStudies: CaseStudy[];
  employees: Employee[];
  assignments: CaseAssignment[];
  submissions?: Submission[];
  departments?: string[];
  currentUser?: Employee | null;
  onAddAssignment: (assignment: CaseAssignment) => void;
  onUpdateAssignment: (assignment: CaseAssignment) => void;
  onDeleteAssignment: (id: string) => void;
  onAddEmployee: (employee: Employee) => void;
  onUpdateEmployee: (employee: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  onImportEmployees?: (employees: Employee[]) => void;
  onGoToEmployeePortal?: () => void;
  onSaveDepartments?: (newDepartments: string[]) => void;
  onRenameDepartment?: (oldName: string, newName: string) => void;
  initialTab?: 'assignments' | 'employees' | 'departments';
}

export const CaseAssignmentManager: React.FC<CaseAssignmentManagerProps> = ({
  caseStudies,
  employees,
  assignments,
  submissions = [],
  departments,
  currentUser,
  onAddAssignment,
  onUpdateAssignment,
  onDeleteAssignment,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onImportEmployees,
  onGoToEmployeePortal,
  onSaveDepartments,
  onRenameDepartment,
  initialTab = 'assignments',
}) => {
  const effectiveDepartments = departments && departments.length > 0 ? departments : Array.from(PANNONJOB_DEPARTMENTS);
  const [activeTab, setActiveTab] = useState<'assignments' | 'employees' | 'departments'>(initialTab);

  // Search & Filter for Assignments
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState<'all' | 'individual' | 'pair'>('all');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<string>('all');

  // Search & Filter for Employees
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState<string>('all');

  // Modals
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<CaseAssignment | null>(null);

  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [passwordResetNotice, setPasswordResetNotice] = useState<{
    employeeName: string;
    newPassword: string;
  } | null>(null);

  const [emailNotificationPreview, setEmailNotificationPreview] = useState<{
    recipientNames: string;
    recipientEmails: string;
    assignerName: string;
    assignerEmail: string;
    subject: string;
    body: string;
    serverNotificationStatus?: string;
  } | null>(null);

  const [copiedEmail, setCopiedEmail] = useState(false);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);

  // Assignment Form State - Default deadline is 2 months from today
  const getDefaultDeadline = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return d.toISOString().split('T')[0];
  };

  const [formCaseId, setFormCaseId] = useState<string>(caseStudies[0]?.id || '');
  const [formAssignmentType, setFormAssignmentType] = useState<'individual' | 'pair'>('individual');
  const [formEmployee1Id, setFormEmployee1Id] = useState<string>(employees[0]?.id || '');
  const [formEmployee2Id, setFormEmployee2Id] = useState<string>(employees[1]?.id || '');
  const [formDeadline, setFormDeadline] = useState<string>(getDefaultDeadline);
  const [formStatus, setFormStatus] = useState<CaseAssignment['status']>('assigned');
  const [formAssignedBy, setFormAssignedBy] = useState(() => currentUser?.name || 'Kármán Veronika');
  const [formInstructions, setFormInstructions] = useState('');

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empDept, setEmpDept] = useState<string>(() => effectiveDepartments[0] || 'Munkaügy');
  const [empPosition, setEmpPosition] = useState('HR Tanácsadó');
  const [empRole, setEmpRole] = useState<UserRole>('employee');

  // Open New Assignment Modal
  const openNewAssignmentModal = (presetEmpId?: string) => {
    setEditingAssignment(null);
    setAssignmentError(null);
    setFormCaseId(caseStudies[0]?.id || '');
    setFormAssignmentType('individual');
    setFormEmployee1Id(presetEmpId || employees[0]?.id || '');
    setFormEmployee2Id(employees[1]?.id || '');
    setFormDeadline(getDefaultDeadline());
    setFormStatus('assigned');
    setFormAssignedBy(currentUser?.name || 'Kármán Veronika');
    setFormInstructions('Kérjük, fókuszáljatok a jogszabályi háttérre és a professzionális, proaktív partneri kommunikációra!');
    setIsAssignmentModalOpen(true);
  };

  // Open Edit Assignment Modal
  const openEditAssignmentModal = (asgn: CaseAssignment) => {
    setEditingAssignment(asgn);
    setAssignmentError(null);
    setFormCaseId(asgn.caseStudyId);
    setFormAssignmentType(asgn.assignmentType);
    setFormEmployee1Id(asgn.assignedEmployees[0]?.id || '');
    setFormEmployee2Id(asgn.assignedEmployees[1]?.id || '');
    setFormDeadline(asgn.deadline);
    setFormStatus(asgn.status || 'assigned');
    setFormAssignedBy(asgn.assignedBy);
    setFormInstructions(asgn.instructions || '');
    setIsAssignmentModalOpen(true);
  };

  // Open New Employee Modal
  const openNewEmployeeModal = () => {
    setEditingEmployee(null);
    setEmpName('');
    setEmpEmail('');
    setEmpDept(PANNONJOB_DEPARTMENTS[0]);
    setEmpPosition('HR Koordinátor');
    setEmpRole('employee');
    setIsEmployeeModalOpen(true);
  };

  // Open Edit Employee Modal
  const openEditEmployeeModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpDept(emp.department);
    setEmpPosition(emp.position || '');
    setEmpRole(emp.role || 'employee');
    setIsEmployeeModalOpen(true);
  };

  // Handle Save Assignment
  const handleSaveAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentError(null);

    const selectedCase = caseStudies.find((c) => c.id === formCaseId) || caseStudies[0];
    if (!selectedCase) return;

    const emp1 = employees.find((e) => e.id === formEmployee1Id);
    if (!emp1) return;

    const assignedEmployeesList: { id: string; name: string; email: string; department: string }[] = [
      {
        id: emp1.id,
        name: emp1.name,
        email: emp1.email,
        department: emp1.department,
      },
    ];

    if (formAssignmentType === 'pair') {
      const emp2 = employees.find((e) => e.id === formEmployee2Id);
      if (emp2 && emp2.id !== emp1.id) {
        assignedEmployeesList.push({
          id: emp2.id,
          name: emp2.name,
          email: emp2.email,
          department: emp2.department,
        });
      }
    }

    // Check duplicate assignment: Same case cannot be assigned to the same employee more than once
    const otherAssignmentsForThisCase = assignments.filter(
      (a) => a.id !== editingAssignment?.id && a.caseStudyId === selectedCase.id
    );

    const duplicateEmployees = assignedEmployeesList.filter((emp) =>
      otherAssignmentsForThisCase.some((a) =>
        a.assignedEmployees.some((ae) => ae.id === emp.id || ae.email.toLowerCase() === emp.email.toLowerCase())
      )
    );

    if (duplicateEmployees.length > 0) {
      setAssignmentError(
        `Figyelem: ${duplicateEmployees.map((e) => e.name).join(', ')} részére a(z) "${selectedCase.title}" esettanulmány már korábban ki lett osztva! Ugyanazt az esetet nem lehet kétszer kiadni ugyanannak a munkavállalónak.`
      );
      return;
    }

    const recipientNames = assignedEmployeesList.map((e) => e.name).join(' és ');
    const recipientEmails = assignedEmployeesList.map((e) => e.email).join(', ');

    const caseDisplayNumber = selectedCase.caseNumber ? `#${selectedCase.caseNumber}. ` : '';
    const portalUrl = getPortalUrl();

    const notificationMessage = `Kedves ${recipientNames}!

Tájékoztatunk, hogy egy új esettanulmányi feladat került hozzárendelésre a fiókodhoz a felkészülési és minőségbiztosítási program keretében:

A HOZZÁRENDELT FELADAT RÉSZLETEI:
=========================================
• Esettanulmány: ${caseDisplayNumber}"${selectedCase.title}"
• Kategória: ${selectedCase.category}
• Kiosztás típusa: ${formAssignmentType === 'pair' ? '👥 Kétfős csoportos megoldás' : '👤 Egyéni feladatmegoldás'}
• Résztvevő(k): ${recipientNames}
• Beküldési Határidő: ${formDeadline}

Instrukció & Elvárások:
"${formInstructions || 'Kérjük, készítsétek el a feladatkidolgozást és a tájékoztató levelet a minőségbiztosítási elvárásoknak megfelelően.'}"

A FELADAT ELÉRÉSE ÉS MEGOLDÁSA:
=========================================
Kattints az alábbi linkre a felület közvetlen megnyitásához és a kidolgozás megkezdéséhez:
👉 ${portalUrl}

Sikeres felkészülést és jó munkát kívánunk!

Üdvözlettel:
Esettanulmányok — Minőségbiztosítási Rendszer`;

    if (editingAssignment) {
      const updated: CaseAssignment = {
        ...editingAssignment,
        caseStudyId: selectedCase.id,
        caseStudyTitle: selectedCase.title,
        assignmentType: formAssignmentType,
        assignedEmployees: assignedEmployeesList,
        assignedBy: formAssignedBy,
        deadline: formDeadline,
        instructions: formInstructions,
        status: formStatus,
        notificationMessage,
      };
      onUpdateAssignment(updated);
    } else {
      const newAsgn: CaseAssignment = {
        id: `asgn-${Date.now()}`,
        caseStudyId: selectedCase.id,
        caseStudyTitle: selectedCase.title,
        assignmentType: formAssignmentType,
        assignedEmployees: assignedEmployeesList,
        assignedBy: formAssignedBy,
        assignedAt: new Date().toISOString(),
        deadline: formDeadline,
        instructions: formInstructions,
        status: formStatus || 'assigned',
        notificationSent: true,
        notificationMessage,
      };
      onAddAssignment(newAsgn);

      const assignerEmail = currentUser?.email || 'karman.veronika91@gmail.com';
      const emailSubject = `[Esettanulmány] Új feladat hozzárendelve: ${caseDisplayNumber}${selectedCase.title}`;

      // Automatically trigger user's default email client (Outlook/Gmail) with pre-filled content
      try {
        openMailClient({
          to: recipientEmails,
          cc: assignerEmail,
          subject: emailSubject,
          body: notificationMessage,
        });
      } catch (err) {
        console.warn('Hiba az e-mail kliens automatikus indításakor:', err);
      }

      // Show instant notification preview
      setEmailNotificationPreview({
        recipientNames,
        recipientEmails,
        assignerName: formAssignedBy,
        assignerEmail,
        subject: emailSubject,
        body: notificationMessage,
        serverNotificationStatus: 'E-mail megnyitva a leveleződben!',
      });

      // Send via server email dispatch endpoint to ensure assigner receives it at their email address
      fetch('/api/send-assignment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignerEmail,
          assignerName: formAssignedBy,
          recipientEmails,
          recipientNames,
          caseTitle: `${caseDisplayNumber}${selectedCase.title}`,
          assignmentType: formAssignmentType,
          deadline: formDeadline,
          instructions: formInstructions,
          subject: emailSubject,
          body: notificationMessage,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          setEmailNotificationPreview((prev) =>
            prev ? { ...prev, serverNotificationStatus: data.transportInfo || `Értesítés elküldve a(z) ${assignerEmail} címre.` } : null
          );
        })
        .catch((err) => {
          console.error('Email dispatch error:', err);
        });
    }

    setIsAssignmentModalOpen(false);
  };

  // Password Reset Handler
  const handleResetPassword = (emp: Employee) => {
    const defaultPwd = emp.defaultPassword || generateDefaultPassword(emp.name);
    const updated: Employee = {
      ...emp,
      password: defaultPwd,
      defaultPassword: defaultPwd,
      mustChangePassword: true,
      passwordChangedAt: undefined,
    };
    onUpdateEmployee(updated);
    setPasswordResetNotice({
      employeeName: emp.name,
      newPassword: defaultPwd,
    });
  };

  // Handle Save Employee
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empEmail.trim()) return;

    if (editingEmployee) {
      const updated: Employee = {
        ...editingEmployee,
        name: empName.trim(),
        email: empEmail.trim(),
        department: empDept,
        position: empPosition.trim(),
        role: empRole,
      };
      onUpdateEmployee(updated);
    } else {
      const defaultPwd = generateDefaultPassword(empName.trim());
      const username = generateUsername(empName.trim(), empEmail.trim());
      const newEmp: Employee = {
        id: `emp-${Date.now()}`,
        name: empName.trim(),
        email: empEmail.trim(),
        department: empDept,
        position: empPosition.trim(),
        role: empRole,
        active: true,
        username,
        password: defaultPwd,
        defaultPassword: defaultPwd,
        mustChangePassword: true,
      };
      onAddEmployee(newEmp);
    }

    setIsEmployeeModalOpen(false);
  };

  // Helper for deadline calculation
  const getDeadlineStatus = (deadlineStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const deadline = new Date(deadlineStr);
    deadline.setHours(0, 0, 0, 0);

    const diffDays = Math.round((deadline.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return { text: `Lejárt (${Math.abs(diffDays)} napja)`, color: 'text-red-700 bg-red-100 border-red-300', isExpired: true };
    } else if (diffDays === 0) {
      return { text: 'Ma jár le!', color: 'text-amber-800 bg-amber-100 border-amber-300 animate-pulse', isExpired: false };
    } else if (diffDays <= 7) {
      return { text: `${diffDays} nap van hátra`, color: 'text-amber-700 bg-amber-50 border-amber-200', isExpired: false };
    } else {
      return { text: `${diffDays} nap van hátra`, color: 'text-slate-700 bg-slate-100 border-slate-200', isExpired: false };
    }
  };

  // Helper for effective status (including automatic or explicit 'expired' / 'Lejárt')
  const getEffectiveAssignmentStatus = (
    asgn: CaseAssignment
  ): { status: 'assigned' | 'in_progress' | 'submitted' | 'completed' | 'expired'; label: string; badgeColor: string } => {
    if (asgn.status === 'expired') {
      return { status: 'expired', label: 'Lejárt', badgeColor: 'bg-red-100 text-red-800 border-red-200' };
    }
    if (asgn.status !== 'completed' && asgn.status !== 'submitted') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const deadline = new Date(asgn.deadline);
      deadline.setHours(0, 0, 0, 0);
      if (!isNaN(deadline.getTime()) && deadline.getTime() < today.getTime()) {
        return { status: 'expired', label: 'Lejárt', badgeColor: 'bg-red-100 text-red-800 border-red-200' };
      }
    }

    switch (asgn.status) {
      case 'in_progress':
        return { status: 'in_progress', label: 'Folyamatban', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'submitted':
        return { status: 'submitted', label: 'Beküldve', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'completed':
        return { status: 'completed', label: 'Befejezve', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'assigned':
      default:
        return { status: 'assigned', label: 'Kiosztva', badgeColor: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  // Filtered Assignments
  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.caseStudyTitle.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      a.assignedEmployees.some((e) => e.name.toLowerCase().includes(assignmentSearch.toLowerCase())) ||
      a.assignedBy.toLowerCase().includes(assignmentSearch.toLowerCase());

    const matchesType = assignmentTypeFilter === 'all' || a.assignmentType === assignmentTypeFilter;
    const effective = getEffectiveAssignmentStatus(a);
    const matchesStatus =
      assignmentStatusFilter === 'all' ||
      a.status === assignmentStatusFilter ||
      effective.status === assignmentStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // Filtered Employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      emp.email.toLowerCase().includes(employeeSearch.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(employeeSearch.toLowerCase()));

    const matchesDept = employeeDeptFilter === 'all' || emp.department === employeeDeptFilter;

    return matchesSearch && matchesDept;
  });

  // Stats calculation
  const totalAssignments = assignments.length;
  const individualCount = assignments.filter((a) => a.assignmentType === 'individual').length;
  const pairCount = assignments.filter((a) => a.assignmentType === 'pair').length;
  const expiredCount = assignments.filter((a) => getEffectiveAssignmentStatus(a).status === 'expired').length;

  return (
    <div className="space-y-6">
      {/* Header Bar with Quick Stats */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Users className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                Esetkiosztás & Munkatársi Csoportok
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Oszd ki a szakmai esettanulmányokat egyéni munkatársaknak vagy 2 fős csoportoknak határidővel és automatikus értesítővel.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => openNewAssignmentModal()}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Új Eset Kiosztása</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">Összes Kiosztás</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center justify-between">
            <span>{totalAssignments}</span>
            <Sparkles className="w-5 h-5 text-amber-500" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Rögzített megbízások</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">👤 Egyéni Kiosztás</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1 flex items-center justify-between">
            <span>{individualCount}</span>
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">1 fős kidolgozások</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">👥 2 Fős Csoportok</span>
          <div className="text-2xl font-extrabold text-purple-600 mt-1 flex items-center justify-between">
            <span>{pairCount}</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Páros csapatmunka</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">⚠️ Lejárt Határidő</span>
          <div className={`text-2xl font-extrabold mt-1 flex items-center justify-between ${expiredCount > 0 ? 'text-red-600' : 'text-slate-700'}`}>
            <span>{expiredCount}</span>
            <AlertTriangle className={`w-5 h-5 ${expiredCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {expiredCount > 0 ? 'Késedelemben lévő esetek' : 'Nincs lejárt határidő'}
          </span>
        </div>
      </div>

      {/* Main Tabs: 1. Kiosztások | 2. Munkatársak | 3. Részlegek */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Kiosztott Esettanulmányok ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'employees'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4 text-amber-400" />
          <span>Munkatársak Törzsadatbázisa ({employees.length} fő)</span>
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeTab === 'departments'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4 text-amber-400" />
          <span>Részlegek & Osztályok ({effectiveDepartments.length})</span>
        </button>
      </div>

      {/* TAB 1: KIOSZTÁSOK KEZELÉSE */}
      {activeTab === 'assignments' && (
        <div className="space-y-4">
          {/* Filter and Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={assignmentSearch}
                onChange={(e) => setAssignmentSearch(e.target.value)}
                placeholder="Keresés kolléga, esettanulmány vagy vezető szerint..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setAssignmentTypeFilter('all')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    assignmentTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Mind ({assignments.length})
                </button>
                <button
                  onClick={() => setAssignmentTypeFilter('individual')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    assignmentTypeFilter === 'individual' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>Egyéni ({individualCount})</span>
                </button>
                <button
                  onClick={() => setAssignmentTypeFilter('pair')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    assignmentTypeFilter === 'pair' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>2 fős csoport ({pairCount})</span>
                </button>
              </div>

              <select
                value={assignmentStatusFilter}
                onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700"
              >
                <option value="all">Minden státusz</option>
                <option value="assigned">Kiosztva</option>
                <option value="in_progress">Folyamatban</option>
                <option value="submitted">Beküldve</option>
                <option value="completed">Befejezve / Értékelve</option>
                <option value="expired">Lejárt</option>
              </select>
            </div>
          </div>

          {/* Assignments List View (Felsorolásszerű lista) */}
          {filteredAssignments.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-800">Nincs találat a megadott szűrési feltételekre</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Oszd ki az első esettanulmányt a munkatársaknak az "Új Eset Kiosztása" gombra kattintva.
              </p>
              <button
                onClick={() => openNewAssignmentModal()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow-sm cursor-pointer"
              >
                + Új Kiosztás Létrehozása
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                      <th className="py-3.5 px-4 sm:px-5">Eset megnevezése</th>
                      <th className="py-3.5 px-4 sm:px-5">Név / Nevek</th>
                      <th className="py-3.5 px-4 sm:px-5">Határidő</th>
                      <th className="py-3.5 px-4 sm:px-5">Státusz</th>
                      <th className="py-3.5 px-4 sm:px-5 text-right">Műveletek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredAssignments.map((asgn) => {
                      const deadlineInfo = getDeadlineStatus(asgn.deadline);
                      const statusInfo = getEffectiveAssignmentStatus(asgn);
                      const isPair = asgn.assignmentType === 'pair';
                      const names = asgn.assignedEmployees.map((e) => e.name).join(', ');

                      return (
                        <tr
                          key={asgn.id}
                          className="hover:bg-amber-50/30 transition-colors group"
                        >
                          {/* 1. Eset megnevezése */}
                          <td className="py-3.5 px-4 sm:px-5 font-bold text-slate-900 align-middle">
                            <div className="flex flex-col">
                              <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug">
                                {asgn.caseStudyTitle}
                              </span>
                              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                    isPair
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {isPair ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                  {isPair ? 'Kétfős csoport' : 'Egyéni'}
                                </span>
                                <span>• Kiosztó: <strong>{asgn.assignedBy}</strong></span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Név / Nevek */}
                          <td className="py-3.5 px-4 sm:px-5 align-middle">
                            <div className="font-bold text-slate-900 text-xs sm:text-sm">
                              {names || '—'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {asgn.assignedEmployees.map((e) => e.department).filter(Boolean).join(' • ')}
                            </div>
                          </td>

                          {/* 3. Határidő */}
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap align-middle">
                            <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                              {asgn.deadline}
                            </div>
                            <div className="mt-0.5">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${deadlineInfo.color}`}
                              >
                                <Clock className="w-3 h-3 mr-1 inline" />
                                {deadlineInfo.text}
                              </span>
                            </div>
                          </td>

                          {/* 4. Státusz */}
                          <td className="py-3.5 px-4 sm:px-5 whitespace-nowrap align-middle">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black border ${statusInfo.badgeColor}`}
                            >
                              {statusInfo.status === 'expired' && (
                                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-red-600 inline" />
                              )}
                              {statusInfo.label}
                            </span>
                          </td>

                          {/* Műveletek */}
                          <td className="py-3.5 px-4 sm:px-5 text-right whitespace-nowrap align-middle">
                            <div className="flex items-center justify-end space-x-1.5">
                              <button
                                onClick={() => {
                                  const rNames = asgn.assignedEmployees.map((e) => e.name).join(' és ');
                                  const rEmails = asgn.assignedEmployees.map((e) => e.email).join(', ');
                                  setEmailNotificationPreview({
                                    recipientNames: rNames,
                                    recipientEmails: rEmails,
                                    assignerName: asgn.assignedBy,
                                    assignerEmail: currentUser?.email || 'karman.veronika91@gmail.com',
                                    subject: `[Esetkiosztás] Esettanulmány Kiosztás: ${asgn.caseStudyTitle}`,
                                    body:
                                      asgn.notificationMessage ||
                                      `Kedves ${rNames}!\n\nVezetőd (${asgn.assignedBy}) kiosztotta számodra a(z) "${asgn.caseStudyTitle}" esettanulmányt.\nHatáridő: ${asgn.deadline}\n\nKérjük, töltsd fel a feladatmegoldást és a tájékoztató levelet a portálra!`,
                                  });
                                }}
                                className="p-2 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
                                title="Értesítő levél"
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEditAssignmentModal(asgn)}
                                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                                title="Szerkesztés"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Biztosan törlöd ezt az esetkiosztást?')) {
                                    onDeleteAssignment(asgn.id);
                                  }
                                }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                title="Törlés"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
        </div>
      )}

      {/* TAB 2: MUNKATÁRSAK TÖRZSYADATBÁZISA */}
      {activeTab === 'employees' && (
        <div className="space-y-4">
          {/* Header Bar for Employees */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                placeholder="Keresés munkatárs neve, e-mailje vagy pozíciója szerint..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3 py-2 font-medium focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={employeeDeptFilter}
                onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-700 max-w-xs"
              >
                <option value="all">Minden Részleg / Osztály</option>
                {effectiveDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => downloadEmployeeTemplate()}
                className="flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-xl border border-slate-300 shadow-xs cursor-pointer text-xs transition-colors"
                title="Minta Excel táblázat letöltése kitöltéshez (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Minta Sablon</span>
              </button>

              {/* Import from Table (Excel/CSV) Button */}
              <button
                type="button"
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs transition-colors"
                title="Munkatársak tömeges behúzása Excel táblázatból vagy kimásolt vágólapról"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>📥 Táblázat Behúzása (Excel/CSV)</span>
              </button>

              <button
                type="button"
                onClick={openNewEmployeeModal}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-xs cursor-pointer text-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>+ Új Munkatárs</span>
              </button>
            </div>
          </div>

          {/* Password Reset Alert Banner if triggered */}
          {passwordResetNotice && (
            <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center space-x-2.5">
                <Key className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="font-extrabold text-amber-950 block">
                    Jelszó Sikeresen Alaphelyzetbe Állítva!
                  </span>
                  <span className="text-amber-900">
                    <strong>{passwordResetNotice.employeeName}</strong> új kezdő jelszava: <code className="bg-amber-200 px-2 py-0.5 rounded font-mono font-bold text-slate-900">{passwordResetNotice.newPassword}</code>. Az első belépéskor kötelező lesz átállítania.
                  </span>
                </div>
              </div>
              <button
                onClick={() => setPasswordResetNotice(null)}
                className="text-amber-800 hover:text-amber-950 font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Employee Directory Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Munkatárs Neve</th>
                    <th className="p-4">Hivatalos E-mail Cím</th>
                    <th className="p-4">Belépési Adatok & Jelszó Státusz</th>
                    <th className="p-4">Szerepkör & Jog</th>
                    <th className="p-4">Részleg / Szakterület</th>
                    <th className="p-4">Munkakör / Pozíció</th>
                    <th className="p-4 text-center">Aktív Kiosztások</th>
                    <th className="p-4 text-right">Műveletek</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEmployees.map((emp) => {
                    const empAssignments = assignments.filter((a) =>
                      a.assignedEmployees.some((e) => e.id === emp.id || e.name === emp.name)
                    );
                    const isAdmin = emp.role === 'admin';
                    const defaultPwd = emp.defaultPassword || generateDefaultPassword(emp.name);
                    const isDefaultPassword = emp.mustChangePassword !== false;

                    return (
                      <tr key={emp.id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full font-extrabold flex items-center justify-center text-xs shadow-xs ${
                              isAdmin ? 'bg-purple-950 text-purple-300 ring-2 ring-purple-500/30' : 'bg-slate-900 text-amber-400'
                            }`}>
                              {emp.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <span className="font-extrabold text-slate-900 block">{emp.name}</span>
                              {isAdmin && (
                                <span className="text-[10px] text-purple-700 font-bold">HR Vezető</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-700">{emp.email}</td>
                        <td className="p-4">
                          <div className="space-y-1">
                            <div className="font-mono text-[11px] text-slate-700 font-bold">
                              @{emp.username || emp.email.split('@')[0]}
                            </div>
                            {isDefaultPassword ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-900 border border-amber-200" title={`Kezdő jelszó: ${defaultPwd}`}>
                                <Key className="w-3 h-3 text-amber-600" />
                                <span>Kezdő: <code className="font-mono font-bold">{defaultPwd}</code></span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Lock className="w-3 h-3 text-emerald-600" />
                                <span>Saját jelszó aktív</span>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            {isAdmin ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs">
                                <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                                <span>👑 Vezető</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                <span>👤 Munkavállaló</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                const newRole: UserRole = isAdmin ? 'employee' : 'admin';
                                onUpdateEmployee({
                                  ...emp,
                                  role: newRole,
                                });
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded transition-colors cursor-pointer border border-slate-200 w-fit"
                              title={isAdmin ? 'Átállítás munkavállalóra (csak a munkatársi portált fogja látni)' : 'Előléptetés vezetővé (látni fogja a vezetői felületet is)'}
                            >
                              {isAdmin ? '→ Munkavállaló' : '→ Vezető'}
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md font-semibold text-[11px] border border-slate-200">
                            {emp.department}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 font-medium">{emp.position || '—'}</td>
                        <td className="p-4 text-center">
                          {empAssignments.length > 0 ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-extrabold text-[11px] border border-amber-300">
                              {empAssignments.length} aktív feladat
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Nincs</span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => openNewAssignmentModal(emp.id)}
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              title="Eset Kiosztása ennek a munkatársnak"
                            >
                              Kiosztás
                            </button>

                            {/* Password Reset Button */}
                            <button
                              onClick={() => {
                                if (window.confirm(`Biztosan visszaállítod ${emp.name} jelszavát a kezdő (${defaultPwd}) értékre?`)) {
                                  handleResetPassword(emp);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title={`Jelszó alaphelyzetbe állítása (${defaultPwd})`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => openEditEmployeeModal(emp)}
                              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Szerkesztés"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`Biztosan törlöd ${emp.name} munkatársat?`)) {
                                  onDeleteEmployee(emp.id);
                                }
                              }}
                              className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Törlés"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RÉSZLEGEK & OSZTÁLYOK KEZELÉSE */}
      {activeTab === 'departments' && (
        <DepartmentManager
          departments={effectiveDepartments}
          employees={employees}
          submissions={submissions}
          assignments={assignments}
          onSaveDepartments={onSaveDepartments || (() => {})}
          onRenameDepartment={onRenameDepartment}
          onGoBack={() => setActiveTab('assignments')}
        />
      )}

      {/* MODAL 1: ÚJ / SZERKESZTETT ESETKIOSZTÁS */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl sm:max-w-2xl w-full max-h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Top Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{editingAssignment ? 'Esetkiosztás Módosítása' : 'Új Esettanulmány Kiosztása Munkatársnak / Csoportnak'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveAssignment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3.5 text-xs">
                {assignmentError && (
                  <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-semibold flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="font-bold block">Duplikált kiosztás nem engedélyezett!</span>
                      <span>{assignmentError}</span>
                    </div>
                  </div>
                )}

                {/* Esettanulmány kiválasztása */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    1. Válassz Esettanulmányt a könyvtárból *
                  </label>
                  <select
                    value={formCaseId}
                    onChange={(e) => {
                      setFormCaseId(e.target.value);
                      setAssignmentError(null);
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    {caseStudies.map((cs, idx) => (
                      <option key={cs.id} value={cs.id}>
                        #{cs.caseNumber || idx + 1}. Esettanulmány: {cs.title} ({cs.category})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Kiosztás típusa: Egyéni vagy Kétfős csoport */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    2. Kiosztás Típusa (Egyéni vagy Csoportos) *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setFormAssignmentType('individual');
                        setAssignmentError(null);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                        formAssignmentType === 'individual'
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs leading-tight">👤 Egyéni Kiosztás</span>
                        <span className="text-[10px] text-slate-500">1 fő részére</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFormAssignmentType('pair');
                        setAssignmentError(null);
                      }}
                      className={`p-3 rounded-xl border text-left flex items-center space-x-2.5 transition-all cursor-pointer ${
                        formAssignmentType === 'pair'
                          ? 'border-amber-500 bg-amber-50/80 shadow-xs'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-extrabold text-slate-900 block text-xs leading-tight">👥 Kétfős Csoport</span>
                        <span className="text-[10px] text-slate-500">2 fős páros munka</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Munkatársak Kiválasztása */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <span className="font-extrabold text-slate-900 block text-xs">
                    3. Munkatárs(ak) hozzárendelése:
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">
                        {formAssignmentType === 'pair' ? '1. Munkatárs (Páros tagja) *' : 'Kijelölt Munkatárs *'}
                      </label>
                      <select
                        value={formEmployee1Id}
                        onChange={(e) => {
                          setFormEmployee1Id(e.target.value);
                          setAssignmentError(null);
                        }}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs"
                        required
                      >
                        {employees.map((emp) => {
                          const isAlreadyAssigned = assignments.some(
                            (a) =>
                              a.id !== editingAssignment?.id &&
                              a.caseStudyId === formCaseId &&
                              a.assignedEmployees.some((ae) => ae.id === emp.id || ae.email.toLowerCase() === emp.email.toLowerCase())
                          );
                          return (
                            <option key={emp.id} value={emp.id}>
                              {emp.name} ({emp.department}){isAlreadyAssigned ? ' ⚠️ (Már kiadva)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {formAssignmentType === 'pair' && (
                      <div>
                        <label className="block font-bold text-purple-950 mb-1">
                          2. Munkatárs (Párja) *
                        </label>
                        <select
                          value={formEmployee2Id}
                          onChange={(e) => {
                            setFormEmployee2Id(e.target.value);
                            setAssignmentError(null);
                          }}
                          className="w-full bg-white border border-purple-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-purple-500 text-xs"
                          required
                        >
                          {employees
                            .filter((emp) => emp.id !== formEmployee1Id)
                            .map((emp) => {
                              const isAlreadyAssigned = assignments.some(
                                (a) =>
                                  a.id !== editingAssignment?.id &&
                                  a.caseStudyId === formCaseId &&
                                  a.assignedEmployees.some((ae) => ae.id === emp.id || ae.email.toLowerCase() === emp.email.toLowerCase())
                              );
                              return (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.department}){isAlreadyAssigned ? ' ⚠️ (Már kiadva)' : ''}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Határidő, Státusz & Vezető */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-slate-800">
                        📅 Beküldési Határidő *
                      </label>
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-bold border border-amber-200">
                        2 hónap
                      </span>
                    </div>
                    <input
                      type="date"
                      value={formDeadline}
                      onChange={(e) => setFormDeadline(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      📌 Státusz
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as CaseAssignment['status'])}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs"
                    >
                      <option value="assigned">Kiosztva</option>
                      <option value="in_progress">Folyamatban</option>
                      <option value="submitted">Beküldve</option>
                      <option value="completed">Befejezve</option>
                      <option value="expired">Lejárt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Kiosztó Vezető Neve *
                    </label>
                    <input
                      type="text"
                      value={formAssignedBy}
                      onChange={(e) => setFormAssignedBy(e.target.value)}
                      placeholder="pl. Kármán Veronika"
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-amber-500 text-xs"
                      required
                    />
                  </div>
                </div>

                {/* Vezetői instrukció */}
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    💬 Egyedi Vezetői Instrukció / Kiemelt Fókusz (opcionális)
                  </label>
                  <textarea
                    rows={2}
                    value={formInstructions}
                    onChange={(e) => setFormInstructions(e.target.value)}
                    placeholder="pl. Kérlek fordítsatok külön figyelmet a Fülöp-szigeteki hatósági határidőkre és a partneri levél érthető megfogalmazására!"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Pinned Bottom Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{editingAssignment ? 'Változtatások Mentése' : 'Kiosztás & Értesítő Küldése'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MUNKATÁRS HOZZÁADÁSA / SZERKESZTÉSE */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Top Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center space-x-2">
                <User className="w-4 h-4 text-amber-400" />
                <span>{editingEmployee ? 'Munkatárs Adatainak Módosítása' : 'Új Munkatárs Felvétele a Törzsadatokba'}</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEmployee} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3 text-xs">
                {/* Szerepkör / Jogosultság választó */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="block font-extrabold text-slate-900 mb-1">
                    Szerepkör & Hozzáférési Jogosultság *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setEmpRole('employee')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        empRole === 'employee'
                          ? 'border-blue-500 bg-blue-50 text-blue-950 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold mb-1">
                        <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                        <span>Munkavállaló</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Munkatársi felület, saját esetek beküldése
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setEmpRole('admin')}
                      className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        empRole === 'admin'
                          ? 'border-purple-500 bg-purple-50 text-purple-950 shadow-2xs'
                          : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 font-bold mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-purple-700" />
                        <span>Vezető / Értékelő</span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        Teljes jog: kiosztás, értékelés, törzsadatok
                      </span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Munkatárs Teljes Neve *</label>
                  <input
                    type="text"
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="pl. Kiss Balázs"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Hivatalos E-mail Cím *</label>
                  <input
                    type="email"
                    value={empEmail}
                    onChange={(e) => setEmpEmail(e.target.value)}
                    placeholder="pl. kiss.balazs@ceg.hu"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-amber-500 text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Munkaterület / Osztály *</label>
                  <select
                    value={empDept}
                    onChange={(e) => setEmpDept(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 text-xs"
                  >
                    {effectiveDepartments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Munkakör / Pozíció</label>
                  <input
                    type="text"
                    value={empPosition}
                    onChange={(e) => setEmpPosition(e.target.value)}
                    placeholder="pl. Senior HR Tanácsadó"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-medium focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>
              </div>

              {/* Pinned Bottom Footer */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Mégse
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  {editingEmployee ? 'Mentés' : 'Munkatárs Mentése'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: KIKÜLDÖTT ÉRTESÍTŐ E-MAIL MEGTEKINTÉSE */}
      {emailNotificationPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl sm:max-w-2xl w-full max-h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Pinned Top Header */}
            <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm">Kiküldött E-mail Értesítés Másolata</h3>
                  <span className="text-[10px] text-slate-400">Esettanulmányok — Minőségbiztosítási Rendszer</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEmailNotificationPreview(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Bezárás"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-1 sm:gap-2">
                  <span className="font-bold text-slate-500 w-24 shrink-0">Címzett(ek):</span>
                  <span className="font-bold text-amber-900 break-all">
                    {emailNotificationPreview.recipientNames} &lt;{emailNotificationPreview.recipientEmails}&gt;
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-1 sm:gap-2">
                  <span className="font-bold text-slate-500 w-24 shrink-0">Másolat:</span>
                  <span className="font-bold text-emerald-800 break-all flex items-center space-x-1">
                    <span>{emailNotificationPreview.assignerName} &lt;{emailNotificationPreview.assignerEmail}&gt;</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold ml-1">Ön (Kiosztó vezető)</span>
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center text-xs gap-1 sm:gap-2">
                  <span className="font-bold text-slate-500 w-24 shrink-0">Tárgy:</span>
                  <span className="font-bold text-slate-900 break-all">{emailNotificationPreview.subject}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                  <span className="text-slate-500">Időpont: {new Date().toLocaleString('hu-HU')}</span>
                  {emailNotificationPreview.serverNotificationStatus && (
                    <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{emailNotificationPreview.serverNotificationStatus}</span>
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">Kiküldött levélszöveg:</label>
                <div className="p-3.5 bg-slate-900 text-amber-300 font-mono text-[11px] sm:text-xs rounded-xl whitespace-pre-line leading-relaxed border border-slate-800 max-h-48 overflow-y-auto">
                  {emailNotificationPreview.body}
                </div>
              </div>
            </div>

            {/* Pinned Bottom Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(emailNotificationPreview.body);
                    setCopiedEmail(true);
                    setTimeout(() => setCopiedEmail(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                >
                  {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedEmail ? 'Másolva!' : 'Szöveg Másolása'}</span>
                </button>

                <a
                  href={`mailto:${encodeURIComponent(emailNotificationPreview.recipientEmails)}?cc=${encodeURIComponent(
                    emailNotificationPreview.assignerEmail
                  )}&subject=${encodeURIComponent(emailNotificationPreview.subject)}&body=${encodeURIComponent(
                    emailNotificationPreview.body
                  )}`}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-xl border border-blue-200 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1"
                  title="Megnyitás levelezőben"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Megnyitás Levelezőben</span>
                </a>
              </div>

              <button
                type="button"
                onClick={() => setEmailNotificationPreview(null)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Rendben, Bezárás
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: TÁBLÁZAT IMPORT MODAL */}
      {isImportModalOpen && (
        <EmployeeTableImportModal
          isOpen={isImportModalOpen}
          existingEmployees={employees}
          onClose={() => setIsImportModalOpen(false)}
          onImportComplete={(imported) => {
            if (onImportEmployees) {
              onImportEmployees(imported);
            } else {
              imported.forEach((emp) => {
                const exists = employees.some((e) => e.id === emp.id || e.email.toLowerCase() === emp.email.toLowerCase());
                if (exists) onUpdateEmployee(emp);
                else onAddEmployee(emp);
              });
            }
            setIsImportModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
