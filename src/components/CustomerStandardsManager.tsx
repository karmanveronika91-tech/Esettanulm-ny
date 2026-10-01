import React from 'react';
import { CustomerServicePillar } from '../types';
import { ShieldCheck, Check, Info } from 'lucide-react';

interface CustomerStandardsManagerProps {
  standards: CustomerServicePillar[];
  onTogglePillar: (id: string) => void;
  onResetStandards: () => void;
}

export const CustomerStandardsManager: React.FC<CustomerStandardsManagerProps> = ({
  standards,
  onTogglePillar,
  onResetStandards,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-md border border-amber-200">
              Minőségbiztosítási Standardok
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2 flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <span>Ügyfélszolgálati Elvárások Tára</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Az alábbi elvárás-rendszer alapján ellenőrzi a rendszer a kolléga által megírt tájékoztató levelet.
          </p>
        </div>

        <button
          onClick={onResetStandards}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer self-start md:self-auto"
        >
          Gyári Elvárások Visszaállítása
        </button>
      </div>

      {/* Info Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start space-x-3 text-xs sm:text-sm text-amber-950">
        <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Mire figyel az AI Értékelő az ügyfélszolgálati elvárásoknál?</strong>
          <p className="mt-0.5 text-amber-900 leading-relaxed">
            Az AI rendszer vizsgálja, hogy a levél tartalmaz-e határozott kötelezettségvállalást és konkrét következő lépést (kerüli-e a "folyamatban van" szót), érthető-e a megfogalmazás, proaktívan mutatja-e be a teendőket, s tiszteletben tartja-e a jogszabályi határokat.
          </p>
        </div>
      </div>

      {/* Grid of Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {standards.map((pillar) => (
          <div
            key={pillar.id}
            className={`bg-white rounded-2xl p-6 border transition-all ${
              pillar.isActive ? 'border-slate-200 shadow-sm' : 'border-slate-200 opacity-60 bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {pillar.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">{pillar.title}</h3>
              </div>

              <button
                type="button"
                onClick={() => onTogglePillar(pillar.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                  pillar.isActive
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {pillar.isActive && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                <span>{pillar.isActive ? 'Aktív' : 'Inaktív'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed">{pillar.description}</p>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Konkrét Működési Elvárások:
              </span>

              <ul className="space-y-2">
                {pillar.subPoints.map((sp) => (
                  <li key={sp.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <span className="font-bold text-slate-900 block mb-0.5">• {sp.title}</span>
                    <p className="text-slate-600 leading-relaxed">{sp.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
