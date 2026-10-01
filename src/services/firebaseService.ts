import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CaseStudy, CustomerServicePillar, Employee, CaseAssignment, Submission } from '../types';
import { DEFAULT_CASE_STUDIES } from '../data/defaultCaseStudies';
import { DEFAULT_CUSTOMER_STANDARDS } from '../data/defaultCustomerStandards';
import { DEFAULT_EMPLOYEES } from '../data/defaultEmployees';
import { DEFAULT_ASSIGNMENTS } from '../data/defaultAssignments';
import { INITIAL_SAMPLE_SUBMISSIONS } from '../data/defaultSubmissions';
import { DEFAULT_DEPARTMENTS } from '../data/pannonjobDepartments';

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Helper to strip undefined values so Firestore never errors on optional fields
export function cleanDoc<T>(obj: T): any {
  return JSON.parse(JSON.stringify(obj));
}

// Use the database ID specified in the configuration with ignoreUndefinedProperties enabled
export const db = initializeFirestore(
  app,
  { ignoreUndefinedProperties: true },
  firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
    ? firebaseConfig.firestoreDatabaseId
    : undefined
);

// Connectivity validation
export async function validateFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firestore] Sikeres kapcsolat a felhő adatbázishoz');
    return true;
  } catch (err: any) {
    if (err?.message?.includes('the client is offline')) {
      console.warn('[Firestore] A kliens offline módban van, helyi gyorsítótár aktív.');
    } else {
      console.log('[Firestore] Kapcsolat inicializálva.');
    }
    return true;
  }
}

// Ensure initial seed data is populated if cloud collections are newly created
export async function seedInitialFirestoreData(): Promise<void> {
  try {
    // 1. Seed Case Studies if empty
    const caseSnap = await getDocs(collection(db, 'caseStudies'));
    if (caseSnap.empty) {
      console.log('[Firestore] Alapértelmezett esettanulmányok betöltése a felhőbe...');
      const batch = writeBatch(db);
      DEFAULT_CASE_STUDIES.forEach((cs) => {
        batch.set(doc(db, 'caseStudies', cs.id), cs);
      });
      await batch.commit();
    }

    // 2. Seed Customer Standards if empty
    const stdSnap = await getDocs(collection(db, 'customerStandards'));
    if (stdSnap.empty) {
      console.log('[Firestore] Alapértelmezett minőségbiztosítási pillérek betöltése a felhőbe...');
      const batch = writeBatch(db);
      DEFAULT_CUSTOMER_STANDARDS.forEach((std) => {
        batch.set(doc(db, 'customerStandards', std.id), std);
      });
      await batch.commit();
    }

    // 3. Seed Employees if empty
    const empSnap = await getDocs(collection(db, 'employees'));
    if (empSnap.empty) {
      console.log('[Firestore] Alapértelmezett munkatársi névsor betöltése a felhőbe...');
      const batch = writeBatch(db);
      DEFAULT_EMPLOYEES.forEach((emp) => {
        batch.set(doc(db, 'employees', emp.id), emp);
      });
      await batch.commit();
    }

    // 4. Seed Assignments if empty
    const asgnSnap = await getDocs(collection(db, 'assignments'));
    if (asgnSnap.empty && DEFAULT_ASSIGNMENTS.length > 0) {
      console.log('[Firestore] Alapértelmezett feladatkiosztások betöltése a felhőbe...');
      const batch = writeBatch(db);
      DEFAULT_ASSIGNMENTS.forEach((asgn) => {
        batch.set(doc(db, 'assignments', asgn.id), asgn);
      });
      await batch.commit();
    }

    // 5. Seed Initial Sample Submissions if empty
    const subSnap = await getDocs(collection(db, 'submissions'));
    if (subSnap.empty && INITIAL_SAMPLE_SUBMISSIONS.length > 0) {
      console.log('[Firestore] Kezdeti minta értékelések betöltése a felhőbe...');
      const batch = writeBatch(db);
      INITIAL_SAMPLE_SUBMISSIONS.forEach((sub) => {
        batch.set(doc(db, 'submissions', sub.id), sub);
      });
      await batch.commit();
    }

    // 6. Seed Departments if empty
    const deptSnap = await getDocs(collection(db, 'departments'));
    if (deptSnap.empty) {
      console.log('[Firestore] Alapértelmezett részlegek betöltése a felhőbe...');
      await setDoc(doc(db, 'departments', 'company_departments'), {
        id: 'company_departments',
        list: DEFAULT_DEPARTMENTS,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error('[Firestore] Kezdeti adatok feltöltési hibája:', err);
  }
}

// ---------------------------------------------------------------------------
// REAL-TIME FIRESTORE LISTENERS
// ---------------------------------------------------------------------------

export function subscribeToCaseStudies(callback: (items: CaseStudy[]) => void) {
  return onSnapshot(
    collection(db, 'caseStudies'),
    (snapshot) => {
      const list: CaseStudy[] = [];
      snapshot.forEach((d) => list.push(d.data() as CaseStudy));
      list.sort((a, b) => (a.caseNumber || 0) - (b.caseNumber || 0));
      callback(list);
    },
    (err) => {
      console.error('[Firestore] subscribeToCaseStudies hiba:', err);
    }
  );
}

export function subscribeToCustomerStandards(callback: (items: CustomerServicePillar[]) => void) {
  return onSnapshot(
    collection(db, 'customerStandards'),
    (snapshot) => {
      const list: CustomerServicePillar[] = [];
      snapshot.forEach((d) => list.push(d.data() as CustomerServicePillar));
      callback(list);
    },
    (err) => {
      console.error('[Firestore] subscribeToCustomerStandards hiba:', err);
    }
  );
}

export function subscribeToEmployees(callback: (items: Employee[]) => void) {
  return onSnapshot(
    collection(db, 'employees'),
    (snapshot) => {
      const list: Employee[] = [];
      snapshot.forEach((d) => list.push(d.data() as Employee));
      callback(list);
    },
    (err) => {
      console.error('[Firestore] subscribeToEmployees hiba:', err);
    }
  );
}

export function subscribeToAssignments(callback: (items: CaseAssignment[]) => void) {
  return onSnapshot(
    collection(db, 'assignments'),
    (snapshot) => {
      const list: CaseAssignment[] = [];
      snapshot.forEach((d) => list.push(d.data() as CaseAssignment));
      list.sort((a, b) => new Date(b.assignedAt || 0).getTime() - new Date(a.assignedAt || 0).getTime());
      callback(list);
    },
    (err) => {
      console.error('[Firestore] subscribeToAssignments hiba:', err);
    }
  );
}

export function subscribeToSubmissions(callback: (items: Submission[]) => void) {
  return onSnapshot(
    collection(db, 'submissions'),
    (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((d) => list.push(d.data() as Submission));
      list.sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
      callback(list);
    },
    (err) => {
      console.error('[Firestore] subscribeToSubmissions hiba:', err);
    }
  );
}

export function subscribeToDepartments(callback: (departments: string[]) => void) {
  return onSnapshot(
    collection(db, 'departments'),
    (snapshot) => {
      let deptList: string[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data.list && Array.isArray(data.list)) {
          deptList = data.list;
        } else if (data.name) {
          deptList.push(data.name);
        }
      });
      if (deptList.length > 0) {
        callback(Array.from(new Set(deptList)));
      }
    },
    (err) => {
      console.error('[Firestore] subscribeToDepartments hiba:', err);
    }
  );
}

// ---------------------------------------------------------------------------
// DIRECT CLOUD SAVE & DELETE OPERATIONS
// ---------------------------------------------------------------------------

export async function firestoreSaveCaseStudy(caseStudy: CaseStudy): Promise<void> {
  try {
    await setDoc(doc(db, 'caseStudies', caseStudy.id), cleanDoc(caseStudy), { merge: true });
    console.log('[Firestore] Esettanulmány mentve:', caseStudy.id);
  } catch (err) {
    console.error('[Firestore] Hiba az esettanulmány mentésekor:', err);
  }
}

export async function firestoreDeleteCaseStudy(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'caseStudies', id));
    console.log('[Firestore] Esettanulmány törölve:', id);
  } catch (err) {
    console.error('[Firestore] Hiba az esettanulmány törlésekor:', err);
  }
}

export async function firestoreSaveEmployee(employee: Employee): Promise<void> {
  try {
    await setDoc(doc(db, 'employees', employee.id), cleanDoc(employee), { merge: true });
    console.log('[Firestore] Munkatárs mentve:', employee.id, employee.name);
  } catch (err) {
    console.error('[Firestore] Hiba a munkatárs mentésekor:', err);
  }
}

export async function firestoreBulkSaveEmployees(employees: Employee[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    employees.forEach((emp) => {
      batch.set(doc(db, 'employees', emp.id), cleanDoc(emp), { merge: true });
    });
    await batch.commit();
    console.log('[Firestore] Kötegelt munkatársi mentés sikeres:', employees.length, 'fő');
  } catch (err) {
    console.error('[Firestore] Hiba a kötegelt munkatársak mentésekor:', err);
  }
}

export async function firestoreDeleteEmployee(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'employees', id));
    console.log('[Firestore] Munkatárs törölve:', id);
  } catch (err) {
    console.error('[Firestore] Hiba a munkatárs törlésekor:', err);
  }
}

export async function firestoreSaveAssignment(assignment: CaseAssignment): Promise<void> {
  try {
    await setDoc(doc(db, 'assignments', assignment.id), cleanDoc(assignment), { merge: true });
    console.log('[Firestore] Kiosztás mentve:', assignment.id, assignment.caseStudyTitle);
  } catch (err) {
    console.error('[Firestore] Hiba a kiosztás mentésekor:', err);
  }
}

export async function firestoreDeleteAssignment(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'assignments', id));
    console.log('[Firestore] Kiosztás törölve:', id);
  } catch (err) {
    console.error('[Firestore] Hiba a kiosztás törlésekor:', err);
  }
}

export async function firestoreSaveSubmission(submission: Submission): Promise<void> {
  try {
    await setDoc(doc(db, 'submissions', submission.id), cleanDoc(submission), { merge: true });
    console.log('[Firestore] Értékelés mentve:', submission.id);
  } catch (err) {
    console.error('[Firestore] Hiba az értékelés mentésekor:', err);
  }
}

export async function firestoreDeleteSubmission(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'submissions', id));
    console.log('[Firestore] Értékelés törölve:', id);
  } catch (err) {
    console.error('[Firestore] Hiba az értékelés törlésekor:', err);
  }
}

export async function firestoreSaveCustomerStandards(standards: CustomerServicePillar[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    standards.forEach((std) => {
      batch.set(doc(db, 'customerStandards', std.id), cleanDoc(std), { merge: true });
    });
    await batch.commit();
    console.log('[Firestore] Minőségbiztosítási pillérek mentve.');
  } catch (err) {
    console.error('[Firestore] Hiba a pillérek mentésekor:', err);
  }
}

export async function firestoreSaveDepartments(departments: string[]): Promise<void> {
  try {
    const sanitized = Array.from(new Set(departments.map((d) => d.trim()).filter(Boolean)));
    await setDoc(
      doc(db, 'departments', 'company_departments'),
      {
        id: 'company_departments',
        list: sanitized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    console.log('[Firestore] Részlegek mentve a felhőbe:', sanitized.length, 'db');
  } catch (err) {
    console.error('[Firestore] Hiba a részlegek mentésekor:', err);
  }
}
