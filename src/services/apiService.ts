import { CaseStudy, CustomerServicePillar, Employee, CaseAssignment, Submission } from '../types';

export interface FullAppState {
  caseStudies: CaseStudy[];
  customerStandards: CustomerServicePillar[];
  employees: Employee[];
  assignments: CaseAssignment[];
  submissions: Submission[];
  departments?: string[];
  lastUpdated: string;
}

export async function fetchServerState(): Promise<FullAppState | null> {
  try {
    const res = await fetch('/api/state', {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (!res.ok) {
      throw new Error(`Szerver válasz kód: ${res.status}`);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('Nem sikerült lekérni a szerver állapotát:', err);
    return null;
  }
}

export async function syncStateWithServer(clientState: {
  caseStudies?: CaseStudy[];
  customerStandards?: CustomerServicePillar[];
  employees?: Employee[];
  assignments?: CaseAssignment[];
  submissions?: Submission[];
}): Promise<FullAppState | null> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(clientState),
    });
    if (!res.ok) {
      throw new Error(`Szinkronizációs hiba: ${res.status}`);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    console.warn('Szinkronizálás sikertelen a szerverrel:', err);
    return null;
  }
}

export async function apiSaveCaseStudy(caseStudy: CaseStudy): Promise<CaseStudy[] | null> {
  try {
    const res = await fetch('/api/case-studies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caseStudy }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.caseStudies || null;
    }
  } catch (e) {
    console.error('apiSaveCaseStudy hiba:', e);
  }
  return null;
}

export async function apiDeleteCaseStudy(id: string): Promise<CaseStudy[] | null> {
  try {
    const res = await fetch(`/api/case-studies/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.caseStudies || null;
    }
  } catch (e) {
    console.error('apiDeleteCaseStudy hiba:', e);
  }
  return null;
}

export async function apiSaveEmployee(employee: Employee): Promise<Employee[] | null> {
  try {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.employees || null;
    }
  } catch (e) {
    console.error('apiSaveEmployee hiba:', e);
  }
  return null;
}

export async function apiDeleteEmployee(id: string): Promise<Employee[] | null> {
  try {
    const res = await fetch(`/api/employees/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.employees || null;
    }
  } catch (e) {
    console.error('apiDeleteEmployee hiba:', e);
  }
  return null;
}

export async function apiSaveAssignment(assignment: CaseAssignment): Promise<CaseAssignment[] | null> {
  try {
    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignment }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.assignments || null;
    }
  } catch (e) {
    console.error('apiSaveAssignment hiba:', e);
  }
  return null;
}

export async function apiDeleteAssignment(id: string): Promise<CaseAssignment[] | null> {
  try {
    const res = await fetch(`/api/assignments/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.assignments || null;
    }
  } catch (e) {
    console.error('apiDeleteAssignment hiba:', e);
  }
  return null;
}

export async function apiSaveSubmission(submission: Submission): Promise<Submission[] | null> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ submission }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.submissions || null;
    }
  } catch (e) {
    console.error('apiSaveSubmission hiba:', e);
  }
  return null;
}

export async function apiDeleteSubmission(id: string): Promise<Submission[] | null> {
  try {
    const res = await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.submissions || null;
    }
  } catch (e) {
    console.error('apiDeleteSubmission hiba:', e);
  }
  return null;
}

export async function apiSaveCustomerStandards(standards: CustomerServicePillar[]): Promise<CustomerServicePillar[] | null> {
  try {
    const res = await fetch('/api/customer-standards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ standards }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.customerStandards || null;
    }
  } catch (e) {
    console.error('apiSaveCustomerStandards hiba:', e);
  }
  return null;
}

export async function apiSaveDepartments(departments: string[]): Promise<string[] | null> {
  try {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ departments }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.data?.departments || null;
    }
  } catch (e) {
    console.error('apiSaveDepartments hiba:', e);
  }
  return null;
}

export async function apiResetAllData(): Promise<FullAppState | null> {
  try {
    const res = await fetch('/api/reset-data', {
      method: 'POST',
    });
    if (res.ok) {
      const data = await res.json();
      return data.data || null;
    }
  } catch (e) {
    console.error('apiResetAllData hiba:', e);
  }
  return null;
}
