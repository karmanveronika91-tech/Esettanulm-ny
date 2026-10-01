import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CaseStudy, CustomerServicePillar, Submission, Employee, CaseAssignment } from './types';
import { DEFAULT_CASE_STUDIES } from './data/defaultCaseStudies';
import { DEFAULT_CUSTOMER_STANDARDS } from './data/defaultCustomerStandards';
import { DEFAULT_EMPLOYEES } from './data/defaultEmployees';
import { DEFAULT_ASSIGNMENTS } from './data/defaultAssignments';
import { INITIAL_SAMPLE_SUBMISSIONS } from './data/defaultSubmissions';
import { DEFAULT_DEPARTMENTS } from './data/pannonjobDepartments';
import {
  fetchServerState,
  syncStateWithServer,
  apiSaveCaseStudy,
  apiDeleteCaseStudy,
  apiSaveEmployee,
  apiDeleteEmployee,
  apiSaveAssignment,
  apiDeleteAssignment,
  apiSaveSubmission,
  apiDeleteSubmission,
  apiSaveCustomerStandards,
  apiSaveDepartments,
} from './services/apiService';
import {
  validateFirestoreConnection,
  seedInitialFirestoreData,
  subscribeToCaseStudies,
  subscribeToCustomerStandards,
  subscribeToEmployees,
  subscribeToAssignments,
  subscribeToSubmissions,
  subscribeToDepartments,
  firestoreSaveCaseStudy,
  firestoreDeleteCaseStudy,
  firestoreSaveEmployee,
  firestoreBulkSaveEmployees,
  firestoreDeleteEmployee,
  firestoreSaveAssignment,
  firestoreDeleteAssignment,
  firestoreSaveSubmission,
  firestoreDeleteSubmission,
  firestoreSaveCustomerStandards,
  firestoreSaveDepartments,
} from './services/firebaseService';
import { sendEmployeeAcceptedEmail, openMailClient } from './services/notificationService';
import { Navbar, MainPortalRole, AdminSubTab } from './components/Navbar';
import { EmployeePortal } from './components/EmployeePortal';
import { LeaderEvaluations } from './components/LeaderEvaluations';
import { CaseStudyManager } from './components/CaseStudyManager';
import { CustomerStandardsManager } from './components/CustomerStandardsManager';
import { DetailedEvaluationView } from './components/DetailedEvaluationView';
import { ReportsAndExport } from './components/ReportsAndExport';
import { CaseAssignmentManager } from './components/CaseAssignmentManager';
import { DepartmentManager } from './components/DepartmentManager';
import { LoginView } from './components/LoginView';
import { PannonJobLogo } from './components/PannonJobLogo';

export default function App() {
  const [currentRole, setCurrentRole] = useState<MainPortalRole>('employee');
  const [adminSubTab, setAdminSubTab] = useState<AdminSubTab>('evaluations');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Authenticated user state - requires explicit login, never auto-logins as anyone
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    if (typeof window !== 'undefined' && (window.location.search.includes('logout') || window.location.search.includes('login'))) {
      localStorage.removeItem('pannonjob_current_user');
      return null;
    }
    const saved = localStorage.getItem('pannonjob_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      } catch (e) {
        console.error('Error parsing current user:', e);
      }
    }
    return null;
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);

  // Departments / Divisions state (customizable by company, synced to Cloud)
  const [departments, setDepartments] = useState<string[]>(() => {
    const saved = localStorage.getItem('pannonjob_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing saved departments:', e);
      }
    }
    return [...DEFAULT_DEPARTMENTS];
  });

  // Auto-switch role if an employee is logged in
  useEffect(() => {
    if (currentUser?.role === 'employee' && currentRole === 'admin') {
      setCurrentRole('employee');
    }
  }, [currentUser, currentRole]);

  // Case Studies state (initialized with local cache, updated from shared server)
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>(() => {
    const saved = localStorage.getItem('pannonjob_case_studies');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing saved case studies:', e);
      }
    }
    return DEFAULT_CASE_STUDIES;
  });

  // Customer Service Standards state
  const [customerStandards, setCustomerStandards] = useState<CustomerServicePillar[]>(() => {
    const saved = localStorage.getItem('pannonjob_customer_standards');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing saved standards:', e);
      }
    }
    return DEFAULT_CUSTOMER_STANDARDS;
  });

  // Employees Roster state
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const mockIds = new Set(['emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6', 'emp-7', 'emp-8', 'emp-admin-1', 'emp-admin-2']);
    const saved = localStorage.getItem('pannonjob_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove mock employees
          const list = parsed.filter((e: Employee) => !mockIds.has(e.id));
          DEFAULT_EMPLOYEES.forEach((defEmp) => {
            const idx = list.findIndex(
              (e) =>
                e.id === defEmp.id ||
                e.username?.toLowerCase() === defEmp.username?.toLowerCase() ||
                e.email?.toLowerCase() === defEmp.email?.toLowerCase()
            );
            if (idx === -1) {
              list.unshift(defEmp);
            } else if (defEmp.id === 'emp-karman-veronika') {
              list[idx] = { ...list[idx], ...defEmp, role: 'admin', email: 'karman.veronika91@gmail.com' };
            }
          });
          return list;
        }
      } catch (e) {
        console.error('Error parsing saved employees:', e);
      }
    }
    return DEFAULT_EMPLOYEES;
  });

  // Case Assignments state
  const [assignments, setAssignments] = useState<CaseAssignment[]>(() => {
    const saved = localStorage.getItem('pannonjob_case_assignments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy mock assignments
          return parsed.filter((a: CaseAssignment) => a.id !== 'asgn-1' && a.id !== 'asgn-2');
        }
      } catch (e) {
        console.error('Error parsing saved assignments:', e);
      }
    }
    return DEFAULT_ASSIGNMENTS;
  });

  // Submissions (Evaluations central database)
  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = localStorage.getItem('pannonjob_submissions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Filter out legacy sample submissions
          return parsed.filter((s: Submission) => !s.id.startsWith('sub-sample-'));
        }
      } catch (e) {
        console.error('Error parsing saved submissions:', e);
      }
    }
    return INITIAL_SAMPLE_SUBMISSIONS;
  });

  // Detailed view state (when clicked)
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);

  // Sync to local storage for instant offline/cache availability
  useEffect(() => {
    localStorage.setItem('pannonjob_case_studies', JSON.stringify(caseStudies));
  }, [caseStudies]);

  useEffect(() => {
    localStorage.setItem('pannonjob_customer_standards', JSON.stringify(customerStandards));
  }, [customerStandards]);

  useEffect(() => {
    localStorage.setItem('pannonjob_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('pannonjob_case_assignments', JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem('pannonjob_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem('pannonjob_departments', JSON.stringify(departments));
  }, [departments]);

  // Keep a ref to latest state for syncing without stale closure issues
  const stateRef = useRef({
    caseStudies,
    customerStandards,
    employees,
    assignments,
    submissions,
    departments,
  });

  useEffect(() => {
    stateRef.current = {
      caseStudies,
      customerStandards,
      employees,
      assignments,
      submissions,
      departments,
    };
  }, [caseStudies, customerStandards, employees, assignments, submissions, departments]);

  // Bidirectional sync: syncs locally entered cases with central server as a secondary backup
  const performSync = useCallback(async () => {
    try {
      setIsSyncing(true);
      await syncStateWithServer(stateRef.current);
      setLastSyncedTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('Sync notice:', err);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  // Firebase real-time sync (Authoritative Cloud Source of Truth)
  useEffect(() => {
    // 1. Initial Firestore connection and seed check
    validateFirestoreConnection();
    seedInitialFirestoreData();

    // 2. Real-time Firebase Firestore subscriptions
    const unsubCases = subscribeToCaseStudies((items) => {
      if (items.length > 0) {
        setCaseStudies(items);
        setLastSyncedTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    });

    const unsubStandards = subscribeToCustomerStandards((items) => {
      if (items.length > 0) {
        setCustomerStandards(items);
      }
    });

    const unsubEmployees = subscribeToEmployees((items) => {
      if (items.length > 0) {
        setEmployees(items);
        setLastSyncedTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      }
    });

    const unsubAssignments = subscribeToAssignments((items) => {
      setAssignments(items);
      setLastSyncedTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    const unsubSubmissions = subscribeToSubmissions((items) => {
      setSubmissions(items);
      setLastSyncedTime(new Date().toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    const unsubDepartments = subscribeToDepartments((items) => {
      if (items.length > 0) {
        setDepartments(items);
      }
    });

    return () => {
      unsubCases();
      unsubStandards();
      unsubEmployees();
      unsubAssignments();
      unsubSubmissions();
      unsubDepartments();
    };
  }, []);

  // Handlers for Submissions with Firebase Cloud Persistence
  const handleSubmitNew = async (newSub: Submission) => {
    setSubmissions((prev) => [newSub, ...prev]);
    await firestoreSaveSubmission(newSub);
    await apiSaveSubmission(newSub);
  };

  const handleUpdateSubmission = async (updated: Submission) => {
    setSubmissions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    if (viewingSubmission?.id === updated.id) {
      setViewingSubmission(updated);
    }
    await firestoreSaveSubmission(updated);
    await apiSaveSubmission(updated);
  };

  const handleDeleteSubmission = async (id: string) => {
    setSubmissions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('pannonjob_submissions', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    if (viewingSubmission?.id === id) {
      setViewingSubmission(null);
    }

    // Reset linked assignment status back to 'assigned' if it was linked to this submission
    setAssignments((prev) => {
      let changed = false;
      const updated = prev.map((a) => {
        if (a.submissionId === id) {
          changed = true;
          const resetAsgn: CaseAssignment = { ...a, status: 'assigned' as const, submissionId: undefined };
          firestoreSaveAssignment(resetAsgn).catch(console.error);
          apiSaveAssignment(resetAsgn).catch(console.error);
          return resetAsgn;
        }
        return a;
      });
      if (changed) {
        try {
          localStorage.setItem('pannonjob_case_assignments', JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
      }
      return updated;
    });

    await firestoreDeleteSubmission(id);
    await apiDeleteSubmission(id);
  };

  const handleClearAllSubmissions = async () => {
    const currentList = [...submissions];
    setSubmissions([]);
    setViewingSubmission(null);
    try {
      localStorage.setItem('pannonjob_submissions', JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
    for (const s of currentList) {
      await firestoreDeleteSubmission(s.id);
      await apiDeleteSubmission(s.id);
    }
  };

  const handleEmployeeDecision = async (submissionId: string, decision: 'accepted' | 'redo') => {
    let updatedObj: Submission | null = null;
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          const isBelow = s.overallScore < 75 || s.taskScore < 75 || s.emailScore < 75;
          const finalStatus = isBelow
            ? 'redo_required'
            : decision === 'accepted'
            ? 'accepted'
            : 'redo_requested';

          const res: Submission = {
            ...s,
            status: finalStatus,
            employeeDecision: decision,
            employeeDecisionAt: new Date().toISOString(),
          };
          updatedObj = res;
          return res;
        }
        return s;
      })
    );

    if (decision === 'accepted') {
      const targetSub = submissions.find((s) => s.id === submissionId);
      if (targetSub) {
        setViewingSubmission({ ...targetSub, status: 'accepted' });
      }

      // Automatically trigger email notification when evaluation is accepted
      if (updatedObj) {
        try {
          const emailRecord = sendEmployeeAcceptedEmail(updatedObj, 'karman.veronika91@gmail.com');
          openMailClient({
            to: 'karman.veronika91@gmail.com',
            cc: updatedObj.colleagueEmail,
            subject: emailRecord.subject,
            body: emailRecord.contentBody,
          });
        } catch (err) {
          console.warn('Nem sikerült az elfogadási e-mail kliens indítása:', err);
        }
      }
    }

    if (updatedObj) {
      await firestoreSaveSubmission(updatedObj);
      await apiSaveSubmission(updatedObj);
    }
  };

  // Case study handlers with Firebase Cloud Persistence
  const handleAddCaseStudy = async (newCase: CaseStudy) => {
    setCaseStudies((prev) => [...prev, newCase]);
    await firestoreSaveCaseStudy(newCase);
    await apiSaveCaseStudy(newCase);
    await performSync();
  };

  const handleUpdateCaseStudy = async (updatedCase: CaseStudy) => {
    setCaseStudies((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
    await firestoreSaveCaseStudy(updatedCase);
    await apiSaveCaseStudy(updatedCase);
  };

  const handleDeleteCaseStudy = async (id: string) => {
    setCaseStudies((prev) => prev.filter((c) => c.id !== id));
    await firestoreDeleteCaseStudy(id);
    await apiDeleteCaseStudy(id);
  };

  // Employee handlers with Firebase Cloud Persistence
  const handleAddEmployee = async (newEmployee: Employee) => {
    setEmployees((prev) => [...prev, newEmployee]);
    await firestoreSaveEmployee(newEmployee);
    await apiSaveEmployee(newEmployee);
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    setEmployees((prev) => prev.map((e) => (e.id === updatedEmployee.id ? updatedEmployee : e)));
    await firestoreSaveEmployee(updatedEmployee);
    await apiSaveEmployee(updatedEmployee);
  };

  const handleDeleteEmployee = async (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    await firestoreDeleteEmployee(id);
    await apiDeleteEmployee(id);
  };

  // Assignment handlers with Firebase Cloud Persistence
  const handleAddAssignment = async (newAssignment: CaseAssignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);
    await firestoreSaveAssignment(newAssignment);
    await apiSaveAssignment(newAssignment);
  };

  const handleUpdateAssignment = async (updatedAssignment: CaseAssignment) => {
    setAssignments((prev) => prev.map((a) => (a.id === updatedAssignment.id ? updatedAssignment : a)));
    await firestoreSaveAssignment(updatedAssignment);
    await apiSaveAssignment(updatedAssignment);
  };

  const handleDeleteAssignment = async (id: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    await firestoreDeleteAssignment(id);
    await apiDeleteAssignment(id);
  };

  const handleTogglePillar = async (id: string) => {
    const updated = customerStandards.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    setCustomerStandards(updated);
    await firestoreSaveCustomerStandards(updated);
    await apiSaveCustomerStandards(updated);
  };

  const handleResetStandards = async () => {
    setCustomerStandards(DEFAULT_CUSTOMER_STANDARDS);
    await firestoreSaveCustomerStandards(DEFAULT_CUSTOMER_STANDARDS);
    await apiSaveCustomerStandards(DEFAULT_CUSTOMER_STANDARDS);
  };

  // Departments handlers with Firebase & Server sync
  const handleSaveDepartments = async (newDepts: string[]) => {
    setDepartments(newDepts);
    try {
      localStorage.setItem('pannonjob_departments', JSON.stringify(newDepts));
    } catch (e) {
      console.error(e);
    }
    await firestoreSaveDepartments(newDepts);
    await apiSaveDepartments(newDepts);
  };

  const handleRenameDepartment = async (oldName: string, newName: string) => {
    // Cascade update to employees
    const updatedEmployees = employees.map((emp) =>
      emp.department === oldName ? { ...emp, department: newName } : emp
    );
    if (JSON.stringify(updatedEmployees) !== JSON.stringify(employees)) {
      setEmployees(updatedEmployees);
      firestoreBulkSaveEmployees(updatedEmployees).catch(console.error);
    }

    // Cascade update to submissions
    const updatedSubmissions = submissions.map((sub) =>
      sub.department === oldName ? { ...sub, department: newName } : sub
    );
    if (JSON.stringify(updatedSubmissions) !== JSON.stringify(submissions)) {
      setSubmissions(updatedSubmissions);
      for (const s of updatedSubmissions) {
        if (s.department === newName) {
          firestoreSaveSubmission(s).catch(console.error);
        }
      }
    }
  };

  // Bulk import employees handler with Firebase Cloud Persistence
  const handleImportEmployees = async (importedList: Employee[]) => {
    setEmployees(importedList);
    localStorage.setItem('pannonjob_employees', JSON.stringify(importedList));
    await firestoreBulkSaveEmployees(importedList);
    for (const emp of importedList) {
      apiSaveEmployee(emp).catch(() => {});
    }
    // If current logged-in user was updated
    if (currentUser) {
      const updatedSelf = importedList.find(
        (e) => e.id === currentUser.id || e.email.toLowerCase() === currentUser.email.toLowerCase()
      );
      if (updatedSelf) {
        setCurrentUser(updatedSelf);
        localStorage.setItem('pannonjob_current_user', JSON.stringify(updatedSelf));
      }
    }
  };

  const handleLoginSuccess = (user: Employee) => {
    setCurrentUser(user);
    localStorage.setItem('pannonjob_current_user', JSON.stringify(user));
    if (user.role === 'admin') {
      setCurrentRole('admin');
    } else {
      setCurrentRole('employee');
    }
    setIsLoginModalOpen(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('pannonjob_current_user');
    setIsLoginModalOpen(false);
  };

  const pendingReviewsCount = submissions.filter((s) => s.status === 'pending_review').length;

  // Non-authenticated users MUST log in - display full-screen login view
  if (!currentUser) {
    return (
      <LoginView
        employees={employees}
        onLogin={handleLoginSuccess}
        onLoginSuccess={handleLoginSuccess}
        onUpdateEmployee={handleUpdateEmployee}
        isModal={false}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans flex flex-col antialiased selection:bg-amber-200 selection:text-slate-900">
      {/* Top Application Header & Navigation */}
      <Navbar
        currentRole={currentRole}
        setCurrentRole={(role) => {
          if (role === 'admin' && currentUser?.role !== 'admin') {
            setIsLoginModalOpen(true);
            return;
          }
          setCurrentRole(role);
          setViewingSubmission(null);
        }}
        adminSubTab={adminSubTab}
        setAdminSubTab={(tab) => {
          setAdminSubTab(tab);
          setViewingSubmission(null);
        }}
        pendingReviewsCount={pendingReviewsCount}
        isSyncing={isSyncing}
        onManualSync={performSync}
        lastSyncedTime={lastSyncedTime}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenUserSwitch={() => setIsLoginModalOpen(true)}
      />

      {/* User Login / Profile Switch Modal */}
      {isLoginModalOpen && (
        <LoginView
          employees={employees}
          onLogin={handleLoginSuccess}
          onLoginSuccess={handleLoginSuccess}
          onUpdateEmployee={handleUpdateEmployee}
          isModal={true}
          onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If viewing a single detailed submission */}
        {viewingSubmission ? (
          <DetailedEvaluationView
            submission={viewingSubmission}
            caseStudies={caseStudies}
            customerStandards={customerStandards}
            onBack={() => setViewingSubmission(null)}
            onEmployeeDecision={handleEmployeeDecision}
            isManagerView={currentRole === 'admin'}
          />
        ) : (
          <>
            {/* ROLE 1: EMPLOYEE PORTAL */}
            {currentRole === 'employee' && (
              <EmployeePortal
                caseStudies={caseStudies}
                customerStandards={customerStandards}
                submissions={submissions}
                currentUser={currentUser}
                assignments={assignments}
                departments={departments}
                onSubmitNew={handleSubmitNew}
                onEmployeeDecision={handleEmployeeDecision}
                onViewDetailedResult={(sub) => setViewingSubmission(sub)}
                onUpdateEmployee={handleUpdateEmployee}
                onOpenLogin={() => setIsLoginModalOpen(true)}
                onNavigateToAssignments={() => {
                  setCurrentRole('admin');
                  setAdminSubTab('assignments');
                }}
              />
            )}

            {/* ROLE 2: ADMIN & HR PORTAL */}
            {currentRole === 'admin' && (
              <>
                {adminSubTab === 'evaluations' && (
                  <LeaderEvaluations
                    submissions={submissions}
                    caseStudies={caseStudies}
                    customerStandards={customerStandards}
                    departments={departments}
                    onUpdateSubmission={handleUpdateSubmission}
                    onDeleteSubmission={handleDeleteSubmission}
                    onClearAllSubmissions={handleClearAllSubmissions}
                  />
                )}

                {adminSubTab === 'reports' && (
                  <ReportsAndExport
                    submissions={submissions}
                    caseStudies={caseStudies}
                    departments={departments}
                    onViewSubmission={(sub) => setViewingSubmission(sub)}
                  />
                )}

                {adminSubTab === 'assignments' && (
                  <CaseAssignmentManager
                    caseStudies={caseStudies}
                    employees={employees}
                    assignments={assignments}
                    submissions={submissions}
                    departments={departments}
                    currentUser={currentUser}
                    onAddAssignment={handleAddAssignment}
                    onUpdateAssignment={handleUpdateAssignment}
                    onDeleteAssignment={handleDeleteAssignment}
                    onAddEmployee={handleAddEmployee}
                    onUpdateEmployee={handleUpdateEmployee}
                    onDeleteEmployee={handleDeleteEmployee}
                    onImportEmployees={handleImportEmployees}
                    onSaveDepartments={handleSaveDepartments}
                    onRenameDepartment={handleRenameDepartment}
                    onGoToEmployeePortal={() => setCurrentRole('employee')}
                  />
                )}

                {adminSubTab === 'departments' && (
                  <DepartmentManager
                    departments={departments}
                    employees={employees}
                    submissions={submissions}
                    assignments={assignments}
                    onSaveDepartments={handleSaveDepartments}
                    onRenameDepartment={handleRenameDepartment}
                    onGoBack={() => setAdminSubTab('assignments')}
                  />
                )}

                {adminSubTab === 'cases' && (
                  <CaseStudyManager
                    caseStudies={caseStudies}
                    onAddCaseStudy={handleAddCaseStudy}
                    onUpdateCaseStudy={handleUpdateCaseStudy}
                    onDeleteCaseStudy={handleDeleteCaseStudy}
                    onSelectForEvaluation={(id) => {
                      setCurrentRole('employee');
                    }}
                  />
                )}

                {adminSubTab === 'standards' && (
                  <CustomerStandardsManager
                    standards={customerStandards}
                    onTogglePillar={handleTogglePillar}
                    onResetStandards={handleResetStandards}
                  />
                )}
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 Esettanulmányok — Minőségbiztosítási Rendszer</span>
          <span className="text-slate-500">
            Közös szerver-oldali szinkronizáció {lastSyncedTime ? `• Legutóbb frissítve: ${lastSyncedTime}` : ''}
          </span>
        </div>
      </footer>
    </div>
  );
}
