import * as XLSX from 'xlsx';
import { Employee, UserRole } from '../types';
import { generateDefaultPassword, generateUsername } from './authUtils';

export interface ParsedEmployeeRow {
  name: string;
  email: string;
  department: string;
  position?: string;
  role: UserRole;
  generatedPassword: string;
  generatedUsername: string;
  isExisting: boolean;
  status: 'valid' | 'invalid';
  errorMessage?: string;
}

/**
 * Normalizes header keys to match Hungarian/English variations
 */
function normalizeHeader(key: string): string {
  const k = key.trim().toLowerCase();
  if (k.includes('név') || k.includes('nev') || k === 'name' || k.includes('munkatars') || k.includes('dolgozo')) {
    return 'name';
  }
  if (k.includes('email') || k.includes('e-mail') || k.includes('posta')) {
    return 'email';
  }
  if (k.includes('részleg') || k.includes('reszleg') || k.includes('osztály') || k.includes('terület') || k.includes('dept') || k.includes('department')) {
    return 'department';
  }
  if (k.includes('pozíció') || k.includes('pozicio') || k.includes('munkakör') || k.includes('beosztás') || k === 'position' || k === 'title') {
    return 'position';
  }
  if (
    k.includes('szerepkör') ||
    k.includes('szerepkor') ||
    k.includes('jogosultság') ||
    k.includes('jogosultsag') ||
    k.includes('jogkör') ||
    k.includes('jogkor') ||
    k.includes('jog') ||
    k.includes('role') ||
    k.includes('admin') ||
    k.includes('hozzáférés') ||
    k.includes('hozzaferes')
  ) {
    return 'role';
  }
  return k;
}

/**
 * Determine UserRole from human-readable text
 */
export function parseEmployeeRole(raw: string): UserRole {
  const r = (raw || '').toLowerCase().trim();
  if (
    r.includes('admin') ||
    r.includes('vezető') ||
    r.includes('vezeto') ||
    r.includes('hr vezető') ||
    r.includes('értékelő') ||
    r.includes('ertekelo') ||
    r.includes('igazgató') ||
    r.includes('igazgato') ||
    r.includes('manager') ||
    r.includes('boss') ||
    r.includes('irányító') ||
    r.includes('super')
  ) {
    return 'admin';
  }
  return 'employee';
}

/**
 * Parses raw JSON rows from XLSX or CSV into structured employee candidates
 */
export function processRawEmployeeData(
  rawRows: Record<string, any>[],
  existingEmployees: Employee[]
): ParsedEmployeeRow[] {
  const existingEmails = new Set(existingEmployees.map((e) => e.email.toLowerCase().trim()));

  return rawRows.map((row) => {
    // Map columns
    const mapped: Record<string, string> = {};
    Object.keys(row).forEach((col) => {
      const normKey = normalizeHeader(col);
      mapped[normKey] = String(row[col] ?? '').trim();
    });

    const name = mapped.name || '';
    let email = mapped.email || '';
    const department = mapped.department || 'Munkaügy';
    const position = mapped.position || '';
    const role: UserRole = parseEmployeeRole(mapped.role);

    // If no email was provided, auto-generate from name
    if (!email && name) {
      const generatedU = generateUsername(name);
      email = `${generatedU}@munkatars-portal.hu`;
    }

    const isValid = Boolean(name && email && email.includes('@'));
    const isExisting = existingEmails.has(email.toLowerCase().trim());
    const generatedPassword = generateDefaultPassword(name);
    const generatedUsername = generateUsername(name, email);

    return {
      name,
      email,
      department,
      position,
      role,
      generatedPassword,
      generatedUsername,
      isExisting,
      status: isValid ? 'valid' : 'invalid',
      errorMessage: !name
        ? 'Hiányzó munkatárs név'
        : !email || !email.includes('@')
        ? 'Érvénytelen e-mail cím'
        : undefined,
    };
  });
}

/**
 * Robust parser for Excel or CSV files
 */
export async function parseExcelOrCsvFile(
  file: File,
  existingEmployees: Employee[]
): Promise<ParsedEmployeeRow[]> {
  const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv') || file.type.includes('text');

  // If CSV, handle directly or fallback
  if (isCsv) {
    try {
      const text = await file.text();
      const parsed = parsePastedTableText(text, existingEmployees);
      if (parsed.length > 0) return parsed;
    } catch (e) {
      console.warn('Direct text read failed for CSV, falling back to XLSX binary reader', e);
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('A feltöltött fájlban nem található munkalap.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Extract as 2D array to inspect headers safely
  const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Filter non-empty rows
  const cleanRows = sheetData.filter((row) =>
    Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== '')
  );

  if (cleanRows.length === 0) {
    throw new Error('A táblázat nem tartalmaz feldolgozható adatokat vagy üres.');
  }

  // Scan top rows to find header row
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(cleanRows.length, 8); i++) {
    const row = cleanRows[i];
    const isHeaderCandidate = row.some((cell) => {
      const s = String(cell).toLowerCase();
      return (
        s.includes('név') ||
        s.includes('nev') ||
        s.includes('name') ||
        s.includes('munkatárs') ||
        s.includes('dolgozó') ||
        s.includes('email') ||
        s.includes('e-mail') ||
        s.includes('részleg') ||
        s.includes('osztály') ||
        s.includes('jog') ||
        s.includes('szerepkör')
      );
    });
    if (isHeaderCandidate) {
      headerRowIdx = i;
      break;
    }
  }

  // Check if header row is a single cell containing delimiter (e.g. semicolon CSV loaded into Excel)
  let rawHeaders = cleanRows[headerRowIdx].map((c) => String(c ?? '').trim());
  let delimiter: string | null = null;
  if (rawHeaders.length === 1 && (rawHeaders[0].includes(';') || rawHeaders[0].includes(','))) {
    delimiter = rawHeaders[0].includes(';') ? ';' : ',';
    rawHeaders = rawHeaders[0].split(delimiter).map((h) => h.trim());
  }

  const dataRows = cleanRows.slice(headerRowIdx + 1);
  const objects: Record<string, string>[] = [];

  dataRows.forEach((row) => {
    let cells: string[] = [];
    if (delimiter) {
      const fullLine = String(row[0] ?? '');
      cells = fullLine.split(delimiter).map((c) => c.trim());
    } else {
      cells = row.map((c) => String(c ?? '').trim());
    }

    if (!cells.some(Boolean)) return;

    const rowObj: Record<string, string> = {};
    rawHeaders.forEach((headerName, colIdx) => {
      rowObj[headerName] = cells[colIdx] ?? '';
    });
    objects.push(rowObj);
  });

  if (objects.length === 0) {
    // If no headers matched or structure was raw, fallback to column indexing
    dataRows.forEach((row) => {
      const cells = row.map((c) => String(c ?? '').trim());
      if (!cells[0]) return;
      objects.push({
        'Név': cells[0] || '',
        'Email': cells[1] || '',
        'Részleg': cells[2] || 'Munkaügy',
        'Pozíció': cells[3] || '',
        'Jogosultság': cells[4] || 'munkavállaló',
      });
    });
  }

  return processRawEmployeeData(objects, existingEmployees);
}

/**
 * Parses pasted text (TSV/CSV copied directly from Excel rows)
 */
export function parsePastedTableText(
  pastedText: string,
  existingEmployees: Employee[]
): ParsedEmployeeRow[] {
  const lines = pastedText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect delimiter: tab or semicolon or comma
  const firstLine = lines[0];
  let delimiter = '\t';
  if (firstLine.includes('\t')) delimiter = '\t';
  else if (firstLine.includes(';')) delimiter = ';';
  else if (firstLine.includes(',')) delimiter = ',';

  const headers = lines[0].split(delimiter).map((h) => h.trim());
  const hasHeaders = headers.some((h) => {
    const norm = normalizeHeader(h);
    return norm === 'name' || norm === 'email' || norm === 'department' || norm === 'role';
  });

  const startIndex = hasHeaders ? 1 : 0;
  const rows: Record<string, any>[] = [];

  for (let i = startIndex; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map((c) => c.trim());
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    if (hasHeaders) {
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] || '';
      });
      rows.push(rowObj);
    } else {
      // Default order: Név | Email | Részleg | Pozíció | Szerepkör
      rows.push({
        name: cols[0] || '',
        email: cols[1] || '',
        department: cols[2] || 'Munkaügy',
        position: cols[3] || '',
        role: cols[4] || 'munkavállaló',
      });
    }
  }

  return processRawEmployeeData(rows, existingEmployees);
}

/**
 * Returns a pre-built rich sample list of employees for instant 1-click test import
 */
export function getSampleEmployeesList(existingEmployees: Employee[]): ParsedEmployeeRow[] {
  const sampleData = [
    {
      name: 'Horváth Ágnes',
      email: 'horvath.agnes@munkatars-portal.hu',
      department: 'Munkaügy',
      position: 'Senior Munkaügyi Tanácsadó',
      role: 'munkavállaló',
    },
    {
      name: 'Varga Balázs',
      email: 'varga.balazs@munkatars-portal.hu',
      department: 'Munkaerő-kölcsönzés Székesfehérvár',
      position: 'Ügyfélszolgálati Vezető Koordinátor',
      role: 'admin',
    },
    {
      name: 'Szabó Tamás',
      email: 'szabo.tamas@munkatars-portal.hu',
      department: 'Munkaerő-kölcsönzés Győr',
      position: 'Munkaerő-kölcsönzési Tanácsadó',
      role: 'munkavállaló',
    },
    {
      name: 'Kiss Eszter',
      email: 'kiss.eszter@munkatars-portal.hu',
      department: 'Diákmunka Üzletág',
      position: 'Diákmunka Projektmenedzser',
      role: 'munkavállaló',
    },
    {
      name: 'Molnár Gergő',
      email: 'molnar.gergo@munkatars-portal.hu',
      department: 'HR és Minőségbiztosítás',
      position: 'Vezető HR Menedzser',
      role: 'admin',
    },
    {
      name: 'Farkas Dóra',
      email: 'farkas.dora@munkatars-portal.hu',
      department: 'Értékesítés és Ügyfélkapcsolat',
      position: 'Key Account Manager',
      role: 'munkavállaló',
    },
  ];

  return processRawEmployeeData(sampleData, existingEmployees);
}

/**
 * Convert parsed rows into concrete Employee objects with generated passwords
 */
export function convertRowsToEmployees(
  rows: ParsedEmployeeRow[],
  existingEmployees: Employee[]
): Employee[] {
  const existingMap = new Map<string, Employee>();
  existingEmployees.forEach((emp) => existingMap.set(emp.email.toLowerCase().trim(), emp));

  const resultEmployees = [...existingEmployees];

  rows.forEach((row) => {
    if (row.status !== 'valid') return;
    const emailKey = row.email.toLowerCase().trim();

    if (existingMap.has(emailKey)) {
      // Update existing
      const existing = existingMap.get(emailKey)!;
      const idx = resultEmployees.findIndex((e) => e.id === existing.id);
      if (idx !== -1) {
        resultEmployees[idx] = {
          ...resultEmployees[idx],
          name: row.name || resultEmployees[idx].name,
          department: row.department || resultEmployees[idx].department,
          position: row.position || resultEmployees[idx].position,
          role: row.role || resultEmployees[idx].role,
          username: row.generatedUsername || resultEmployees[idx].username,
          // Preserve custom password if already set, or re-verify default
          defaultPassword: row.generatedPassword,
        };
      }
    } else {
      // Add new employee
      const newEmp: Employee = {
        id: `emp-imported-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: row.name,
        email: row.email,
        department: row.department || 'Munkaügy',
        position: row.position || '',
        role: row.role || 'employee',
        username: row.generatedUsername,
        password: row.generatedPassword,
        defaultPassword: row.generatedPassword,
        mustChangePassword: true, // Needs to change password on first login
        active: true,
      };
      resultEmployees.push(newEmp);
    }
  });

  return resultEmployees;
}

/**
 * Generates and downloads a sample Excel (.xlsx) template
 */
export function downloadEmployeeTemplate(): void {
  const sampleData = [
    {
      'Munkatárs Neve': 'Kovács Péter',
      'Hivatalos E-mail Cím': 'kovacs.peter@munkatars-portal.hu',
      'Jogosultság (munkavállaló vagy vezető)': 'munkavállaló',
      'Részleg / Osztály': 'Munkaügy',
      'Munkakör / Pozíció': 'Senior Munkaügyi Tanácsadó',
    },
    {
      'Munkatárs Neve': 'Tóth Katalin',
      'Hivatalos E-mail Cím': 'toth.katalin@munkatars-portal.hu',
      'Jogosultság (munkavállaló vagy vezető)': 'munkavállaló',
      'Részleg / Osztály': 'Munkaerő-kölcsönzés Székesfehérvár',
      'Munkakör / Pozíció': 'Ügyfélszolgálati Koordinátor',
    },
    {
      'Munkatárs Neve': 'Nagy Veronika',
      'Hivatalos E-mail Cím': 'hr.igazgato@munkatars-portal.hu',
      'Jogosultság (munkavállaló vagy vezető)': 'vezető',
      'Részleg / Osztály': 'HR és Minőségbiztosítás',
      'Munkakör / Pozíció': 'HR és Szolgáltatási Igazgató',
    },
    {
      'Munkatárs Neve': 'Kármán Veronika',
      'Hivatalos E-mail Cím': 'karman.veronika91@gmail.com',
      'Jogosultság (munkavállaló vagy vezető)': 'vezető',
      'Részleg / Osztály': 'Minőségbiztosítás',
      'Munkakör / Pozíció': 'HR Vezető & Értékelő',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Munkatársak');

  // Column widths
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 32 },
    { wch: 34 },
    { wch: 32 },
    { wch: 30 },
  ];

  XLSX.writeFile(workbook, 'Munkatarsak_Import_Sablon.xlsx');
}
