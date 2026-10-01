import React, { useState, useRef } from 'react';
import { Employee } from '../types';
import {
  parseExcelOrCsvFile,
  parsePastedTableText,
  convertRowsToEmployees,
  downloadEmployeeTemplate,
  ParsedEmployeeRow,
} from '../utils/employeeExcelImporter';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  X,
  Clipboard,
  ShieldCheck,
  UserCheck,
  Key,
  Users,
  Check,
  Sparkles,
} from 'lucide-react';

interface EmployeeTableImportModalProps {
  existingEmployees: Employee[];
  isOpen?: boolean;
  onClose: () => void;
  onImportComplete: (updatedEmployees: Employee[]) => void;
}

export const EmployeeTableImportModal: React.FC<EmployeeTableImportModalProps> = ({
  existingEmployees,
  isOpen = true,
  onClose,
  onImportComplete,
}) => {
  const [importMode, setImportMode] = useState<'file' | 'paste'>('file');
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [pastedText, setPastedText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isOpen === false) return null;

  const processFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadedFileName(file.name);
    try {
      const rows = await parseExcelOrCsvFile(file, existingEmployees);
      if (!rows || rows.length === 0) {
        setErrorMessage('A kiválasztott fájlban nem találtunk feldolgozható munkatárs adatokat.');
        setParsedRows([]);
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Hiba történt a táblázat beolvasásakor. Ellenőrizd a fájl formátumát (.xlsx vagy .csv).');
      setParsedRows([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Kérjük, illeszd be a vágólapra másolt Excel táblázat sorait!');
      return;
    }

    setErrorMessage(null);
    try {
      const rows = parsePastedTableText(pastedText, existingEmployees);
      if (rows.length === 0) {
        setErrorMessage('Nem sikerült érvényes munkatársi sorokat azonosítani a beillesztett szövegben.');
      } else {
        setLoadedFileName('Vágólapról beillesztett táblázat');
        setParsedRows(rows);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Hiba a beillesztett szöveg feldolgozásakor.');
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    const validRows = parsedRows.filter((r) => r.status === 'valid');
    if (validRows.length === 0) {
      setErrorMessage('Nincs importálható érvényes munkatársi sor.');
      return;
    }

    const updated = convertRowsToEmployees(validRows, existingEmployees);
    onImportComplete(updated);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.status === 'valid').length;
  const newCount = parsedRows.filter((r) => r.status === 'valid' && !r.isExisting).length;
  const updateCount = parsedRows.filter((r) => r.status === 'valid' && r.isExisting).length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl font-bold shadow-md">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center space-x-2">
                <span>Munkatársak Törzsadatainak Importálása Táblázatból</span>
              </h2>
              <p className="text-xs text-slate-300">
                Excel (.xlsx, .xls) vagy CSV (.csv) feltöltés • Automatikus jelszógenerálás (Vezetéknév123)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Action Tabs & Template Download */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setImportMode('file')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  importMode === 'file' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>1. Excel / CSV Fájl Feltöltése</span>
              </button>
              <button
                type="button"
                onClick={() => setImportMode('paste')}
                className={`px-4 py-2 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
                  importMode === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clipboard className="w-4 h-4" />
                <span>2. Táblázat Másolása & Beillesztése</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadEmployeeTemplate}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-slate-700 font-bold hover:text-slate-900 transition-all cursor-pointer text-xs"
                title="Excel sablon letöltése a helyes oszlopokkal"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span>Üres Excel Sablon Letöltése</span>
              </button>
            </div>
          </div>

          {/* MODE 1: FILE UPLOAD */}
          {importMode === 'file' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-600">
                <span className="font-bold text-slate-800 block">Táblázat oszlopai & Jogosultságok:</span>
                <p className="text-[11px] leading-relaxed">
                  • <strong>Név</strong> | <strong>E-mail</strong> | <strong>Jogosultság</strong> (<code>munkavállaló</code> vagy <code>vezető</code>) | <strong>Részleg</strong> | <strong>Pozíció</strong><br />
                  • <strong>👤 Munkavállaló:</strong> Kizárólag a Munkatárs Portált látja a feladataival.<br />
                  • <strong>👑 Vezető:</strong> Teljes hozzáféréssel látja a Vezetői felületet és a Munkatárs Portált is.<br />
                  • Kezdő jelszó mindenkinek automatikusan: <code className="bg-white px-1.5 py-0.5 rounded border border-amber-300 font-bold text-slate-900">Vezetéknév123</code>.
                </p>
              </div>

              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 ${
                  isDragging
                    ? 'border-amber-500 bg-amber-100/60 ring-4 ring-amber-400/30'
                    : 'border-slate-300 hover:border-amber-500 bg-slate-50 hover:bg-amber-50/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-bold">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-extrabold text-slate-900 text-sm block">
                    Kattints ide a táblázat kiválasztásához vagy húzd ide a fájlt (.xlsx, .csv)
                  </span>
                  <span className="text-slate-500 text-xs mt-1 block">
                    Támogatott formátumok: .xlsx, .xls, .csv (pontosvesszős és vesszős CSV is támogatott)
                  </span>
                </div>
                {isLoading && (
                  <div className="text-xs font-bold text-amber-700 animate-pulse">
                    Táblázat beolvasása és adatok elemzése folyamatban...
                  </div>
                )}
                {loadedFileName && !isLoading && (
                  <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Fájl betöltve: {loadedFileName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* MODE 2: PASTE TEXT */}
          {importMode === 'paste' && (
            <div className="space-y-3">
              <label className="block font-bold text-slate-800">
                Másold ki az Excel vagy Google Táblázat soraidat, és illeszd be ide:
              </label>
              <textarea
                rows={5}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Példa sorok:&#10;Kovács Péter	kovacs.peter@ceg.hu	Munkaügy	Senior Tanácsadó	munkavállaló&#10;Nagy Veronika	hr.igazgato@ceg.hu	HR	HR Igazgató	vezető"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 font-mono text-xs text-slate-900 focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleProcessPastedText}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Beillesztett Sorok Elemzése</span>
              </button>
            </div>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-xl text-red-800 text-xs font-semibold flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PARSED PREVIEW TABLE */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-center space-x-2 text-xs font-bold text-amber-950">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Feldolgozva: <strong>{validCount}</strong> érvényes munkatárs ({newCount} új felvétel, {updateCount} meglévő frissítése)
                  </span>
                </div>
                <span className="text-[11px] text-slate-600">
                  🔑 Mindenkinek legenerálva: <code className="bg-white px-2 py-0.5 rounded border border-amber-300 font-bold">Vezetéknév123</code> (pl. Karman123)
                </span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Név</th>
                        <th className="p-2.5">Hivatalos E-mail</th>
                        <th className="p-2.5">Részleg</th>
                        <th className="p-2.5">Szerepkör</th>
                        <th className="p-2.5">Generált Felhasználónév</th>
                        <th className="p-2.5">Generált Jelszó</th>
                        <th className="p-2.5 text-center">Státusz</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.status === 'valid' ? 'hover:bg-slate-50' : 'bg-red-50/60 text-red-900'}
                        >
                          <td className="p-2.5 font-bold text-slate-900">{row.name || '—'}</td>
                          <td className="p-2.5 font-mono text-slate-700">{row.email || '—'}</td>
                          <td className="p-2.5">{row.department}</td>
                          <td className="p-2.5">
                            {row.role === 'admin' ? (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 rounded font-extrabold text-[10px] inline-flex items-center space-x-1">
                                <span>👑 Vezető (Vezetői & Munkatárs)</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded font-bold text-[10px] inline-flex items-center space-x-1">
                                <span>👤 Munkavállaló (Csak Munkatárs Portál)</span>
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-mono text-slate-600 font-bold">@{row.generatedUsername}</td>
                          <td className="p-2.5 font-mono font-bold text-amber-800 bg-amber-50/50">
                            {row.generatedPassword}
                          </td>
                          <td className="p-2.5 text-center">
                            {row.status === 'valid' ? (
                              row.isExisting ? (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-[10px] font-bold">
                                  Frissítés
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">
                                  Új
                                </span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-[10px] font-bold">
                                Hiba
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold transition-all cursor-pointer text-xs"
          >
            Mégse
          </button>

          <button
            type="button"
            disabled={validCount === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center space-x-2 text-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{validCount} Munkatárs Importálása & Mentése</span>
          </button>
        </div>
      </div>
    </div>
  );
};
