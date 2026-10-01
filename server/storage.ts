import fs from 'fs';
import path from 'path';
import { CaseStudy, CustomerServicePillar, Employee, CaseAssignment, Submission } from '../src/types';
import { DEFAULT_CASE_STUDIES } from '../src/data/defaultCaseStudies';
import { DEFAULT_CUSTOMER_STANDARDS } from '../src/data/defaultCustomerStandards';
import { DEFAULT_EMPLOYEES } from '../src/data/defaultEmployees';
import { DEFAULT_ASSIGNMENTS } from '../src/data/defaultAssignments';
import { INITIAL_SAMPLE_SUBMISSIONS } from '../src/data/defaultSubmissions';
import { DEFAULT_DEPARTMENTS } from '../src/data/pannonjobDepartments';

export interface ServerDatabase {
  caseStudies: CaseStudy[];
  customerStandards: CustomerServicePillar[];
  employees: Employee[];
  assignments: CaseAssignment[];
  submissions: Submission[];
  departments: string[];
  lastUpdated: string;
}

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'app_database.json');

function getDefaultDatabase(): ServerDatabase {
  return {
    caseStudies: DEFAULT_CASE_STUDIES,
    customerStandards: DEFAULT_CUSTOMER_STANDARDS,
    employees: DEFAULT_EMPLOYEES,
    assignments: DEFAULT_ASSIGNMENTS,
    submissions: INITIAL_SAMPLE_SUBMISSIONS,
    departments: [...DEFAULT_DEPARTMENTS],
    lastUpdated: new Date().toISOString(),
  };
}

class StorageManager {
  private db: ServerDatabase;

  constructor() {
    this.db = this.loadFromDisk();
  }

  private loadFromDisk(): ServerDatabase {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.caseStudies)) {
          // Filter out legacy mock sample submissions
          const loadedSubmissions: Submission[] = (parsed.submissions || []).filter(
            (s: Submission) => !s.id.startsWith('sub-sample-')
          );

          // Filter out legacy mock assignments
          const loadedAssignments: CaseAssignment[] = (parsed.assignments || []).filter(
            (a: CaseAssignment) => a.id !== 'asgn-1' && a.id !== 'asgn-2'
          );

          // Filter out legacy mock employees (Kovacs, Szabo, etc.)
          const mockEmpIds = new Set([
            'emp-1', 'emp-2', 'emp-3', 'emp-4', 'emp-5', 'emp-6', 'emp-7', 'emp-8',
            'emp-admin-1', 'emp-admin-2'
          ]);
          const loadedEmployees: Employee[] = (parsed.employees || []).filter(
            (e: Employee) => !mockEmpIds.has(e.id)
          );

          const empMap = new Map<string, Employee>();
          loadedEmployees.forEach((e) => empMap.set(e.id, e));
          DEFAULT_EMPLOYEES.forEach((defEmp) => {
            if (!empMap.has(defEmp.id)) {
              empMap.set(defEmp.id, defEmp);
            } else if (defEmp.id === 'emp-karman-veronika') {
              const existing = empMap.get(defEmp.id)!;
              empMap.set(defEmp.id, {
                ...existing,
                email: 'karman.veronika91@gmail.com',
                name: 'Kármán Veronika',
                role: 'admin',
              });
            }
          });

          const state: ServerDatabase = {
            caseStudies: parsed.caseStudies.length > 0 ? parsed.caseStudies : DEFAULT_CASE_STUDIES,
            customerStandards: parsed.customerStandards?.length > 0 ? parsed.customerStandards : DEFAULT_CUSTOMER_STANDARDS,
            employees: Array.from(empMap.values()),
            assignments: loadedAssignments,
            submissions: loadedSubmissions,
            departments: Array.isArray(parsed.departments) && parsed.departments.length > 0 ? parsed.departments : [...DEFAULT_DEPARTMENTS],
            lastUpdated: parsed.lastUpdated || new Date().toISOString(),
          };
          this.saveToDisk(state);
          return state;
        }
      }
    } catch (err) {
      console.error('Hiba az adatbázis fájl beolvasásakor, alapértelmezett adatok betöltése:', err);
    }

    const defaultDb = getDefaultDatabase();
    this.saveToDisk(defaultDb);
    return defaultDb;
  }

  private saveToDisk(data: ServerDatabase): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      data.lastUpdated = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
      this.db = data;
    } catch (err) {
      console.error('Hiba az adatbázis mentésekor:', err);
    }
  }

  public getState(): ServerDatabase {
    return this.db;
  }

  public mergeClientState(clientState: {
    caseStudies?: CaseStudy[];
    customerStandards?: CustomerServicePillar[];
    employees?: Employee[];
    assignments?: CaseAssignment[];
    submissions?: Submission[];
  }): ServerDatabase {
    const current = this.db;

    // 1. Merge Case Studies (Unique by ID; if client has extra cases created by another user, include them!)
    const caseMap = new Map<string, CaseStudy>();
    current.caseStudies.forEach((c) => caseMap.set(c.id, c));
    if (clientState.caseStudies && Array.isArray(clientState.caseStudies)) {
      clientState.caseStudies.forEach((clientCase) => {
        if (!caseMap.has(clientCase.id)) {
          caseMap.set(clientCase.id, clientCase);
        } else {
          // Keep existing but update non-default customized fields if changed
          const existing = caseMap.get(clientCase.id)!;
          caseMap.set(clientCase.id, { ...existing, ...clientCase });
        }
      });
    }

    // Re-index case numbers sequentially if needed
    const mergedCases = Array.from(caseMap.values()).map((cs, idx) => ({
      ...cs,
      caseNumber: cs.caseNumber || idx + 1,
    }));

    // 2. Merge Employees
    const empMap = new Map<string, Employee>();
    current.employees.forEach((e) => empMap.set(e.id, e));
    if (clientState.employees && Array.isArray(clientState.employees)) {
      clientState.employees.forEach((clientEmp) => {
        if (!empMap.has(clientEmp.id)) {
          empMap.set(clientEmp.id, clientEmp);
        } else {
          const existing = empMap.get(clientEmp.id)!;
          empMap.set(clientEmp.id, { ...existing, ...clientEmp });
        }
      });
    }
    const mergedEmployees = Array.from(empMap.values());

    // 3. Merge Assignments
    const asgnMap = new Map<string, CaseAssignment>();
    current.assignments.forEach((a) => asgnMap.set(a.id, a));
    if (clientState.assignments && Array.isArray(clientState.assignments)) {
      clientState.assignments.forEach((clientAsgn) => {
        if (!asgnMap.has(clientAsgn.id)) {
          asgnMap.set(clientAsgn.id, clientAsgn);
        } else {
          const existing = asgnMap.get(clientAsgn.id)!;
          asgnMap.set(clientAsgn.id, { ...existing, ...clientAsgn });
        }
      });
    }
    const mergedAssignments = Array.from(asgnMap.values());

    // 4. Merge Submissions
    const subMap = new Map<string, Submission>();
    current.submissions.forEach((s) => subMap.set(s.id, s));
    if (clientState.submissions && Array.isArray(clientState.submissions)) {
      clientState.submissions.forEach((clientSub) => {
        if (!subMap.has(clientSub.id)) {
          subMap.set(clientSub.id, clientSub);
        } else {
          const existing = subMap.get(clientSub.id)!;
          subMap.set(clientSub.id, { ...existing, ...clientSub });
        }
      });
    }
    const mergedSubmissions = Array.from(subMap.values());

    // 5. Standards
    let mergedStandards = current.customerStandards;
    if (clientState.customerStandards && clientState.customerStandards.length > 0) {
      mergedStandards = clientState.customerStandards;
    }

    // 6. Departments
    let mergedDepartments = current.departments || [...DEFAULT_DEPARTMENTS];
    if ((clientState as any).departments && Array.isArray((clientState as any).departments) && (clientState as any).departments.length > 0) {
      mergedDepartments = Array.from(new Set((clientState as any).departments.map((d: string) => d.trim()).filter(Boolean)));
    }

    const updatedDb: ServerDatabase = {
      caseStudies: mergedCases,
      customerStandards: mergedStandards,
      employees: mergedEmployees,
      assignments: mergedAssignments,
      submissions: mergedSubmissions,
      departments: mergedDepartments,
      lastUpdated: new Date().toISOString(),
    };

    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public saveDepartments(departments: string[]): ServerDatabase {
    const sanitized = Array.from(new Set(departments.map((d) => d.trim()).filter(Boolean)));
    const updatedDb = { ...this.db, departments: sanitized };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public saveCaseStudy(caseStudy: CaseStudy): ServerDatabase {
    const existingIdx = this.db.caseStudies.findIndex((c) => c.id === caseStudy.id);
    let updatedCases = [...this.db.caseStudies];
    if (existingIdx >= 0) {
      updatedCases[existingIdx] = caseStudy;
    } else {
      const nextNum = (this.db.caseStudies[this.db.caseStudies.length - 1]?.caseNumber || this.db.caseStudies.length) + 1;
      updatedCases.push({
        ...caseStudy,
        caseNumber: caseStudy.caseNumber || nextNum,
      });
    }
    const updatedDb = { ...this.db, caseStudies: updatedCases };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public deleteCaseStudy(id: string): ServerDatabase {
    const updatedCases = this.db.caseStudies.filter((c) => c.id !== id);
    const updatedDb = { ...this.db, caseStudies: updatedCases };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public saveEmployee(employee: Employee): ServerDatabase {
    const existingIdx = this.db.employees.findIndex((e) => e.id === employee.id);
    let updated = [...this.db.employees];
    if (existingIdx >= 0) {
      updated[existingIdx] = employee;
    } else {
      updated.push(employee);
    }
    const updatedDb = { ...this.db, employees: updated };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public deleteEmployee(id: string): ServerDatabase {
    const updated = this.db.employees.filter((e) => e.id !== id);
    const updatedDb = { ...this.db, employees: updated };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public saveAssignment(assignment: CaseAssignment): ServerDatabase {
    const existingIdx = this.db.assignments.findIndex((a) => a.id === assignment.id);
    let updated = [...this.db.assignments];
    if (existingIdx >= 0) {
      updated[existingIdx] = assignment;
    } else {
      updated.push(assignment);
    }
    const updatedDb = { ...this.db, assignments: updated };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public deleteAssignment(id: string): ServerDatabase {
    const updated = this.db.assignments.filter((a) => a.id !== id);
    const updatedDb = { ...this.db, assignments: updated };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public saveSubmission(submission: Submission): ServerDatabase {
    const existingIdx = this.db.submissions.findIndex((s) => s.id === submission.id);
    let updated = [...this.db.submissions];
    if (existingIdx >= 0) {
      updated[existingIdx] = submission;
    } else {
      updated.unshift(submission);
    }
    const updatedDb = { ...this.db, submissions: updated };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public deleteSubmission(id: string): ServerDatabase {
    const updated = this.db.submissions.filter((s) => s.id !== id);
    const updatedDb = { ...this.db, submissions: updated };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public saveStandards(standards: CustomerServicePillar[]): ServerDatabase {
    const updatedDb = { ...this.db, customerStandards: standards };
    this.saveToDisk(updatedDb);
    return updatedDb;
  }

  public resetToDefaults(): ServerDatabase {
    const defaultDb = getDefaultDatabase();
    this.saveToDisk(defaultDb);
    return defaultDb;
  }
}

export const serverStorage = new StorageManager();
