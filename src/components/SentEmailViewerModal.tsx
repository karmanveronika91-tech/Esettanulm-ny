import React, { useState } from 'react';
import { SentEmailNotification } from '../types';
import { Mail, Check, Copy, X, Calendar, User, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SentEmailViewerModalProps {
  email: SentEmailNotification | null;
  onClose: () => void;
}

export const SentEmailViewerModal: React.FC<SentEmailViewerModalProps> = ({ email, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!email) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(email.contentBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl sm:max-w-2xl w-full max-h-[88vh] flex flex-col border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Pinned Top Header */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
              <Mail className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm">Hivatalos Kiküldött E-mail Értesítés</h3>
              <span className="text-[10px] text-slate-400">Esettanulmányok — Minőségbiztosítási Rendszer</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-500 w-16 shrink-0">Címzett:</span>
                <span className="font-bold text-amber-900 break-all">
                  {email.recipientName} &lt;{email.recipientEmail}&gt;
                </span>
              </div>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px] shrink-0">
                ✅ Kiküldve
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-500 w-16 shrink-0">Tárgy:</span>
              <span className="font-bold text-slate-900 break-all">{email.subject}</span>
            </div>

            <div className="flex items-center justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200">
              <span>📅 Kiküldve: {new Date(email.sentAt).toLocaleString('hu-HU')}</span>
              {typeof email.overallScore === 'number' && (
                <span className="font-bold text-slate-700">
                  Értékelési eredmény: <strong>{email.overallScore}%</strong>
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-[11px]">E-mail Törzsszöveg Másolata:</label>
            <div className="p-3.5 bg-slate-900 text-amber-300 font-mono text-[11px] sm:text-xs rounded-xl whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto border border-slate-800">
              {email.contentBody}
            </div>
          </div>
        </div>

        {/* Pinned Bottom Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Másolva!' : 'Szöveg Másolása'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  );
};
