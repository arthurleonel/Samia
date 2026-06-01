import React, { useState } from 'react';
import { OperatingHour, ThemePreset } from '../types';
import { Clock, Check, ToggleLeft, ToggleRight, Save } from 'lucide-react';

interface HorariosViewProps {
  operatingHours: OperatingHour[];
  theme: ThemePreset;
  customPrimary: string;
  onUpdateOperatingHours: (hours: OperatingHour[]) => void;
}

export default function HorariosView({
  operatingHours,
  theme,
  customPrimary,
  onUpdateOperatingHours,
}: HorariosViewProps) {
  const [localHours, setLocalHours] = useState<OperatingHour[]>(operatingHours);
  const [wasSaved, setWasSaved] = useState(false);

  const handleToggleDay = (idx: number) => {
    const updated = [...localHours];
    updated[idx].enabled = !updated[idx].enabled;
    setLocalHours(updated);
  };

  const handleChangeTime = (idx: number, field: 'start' | 'end', val: string) => {
    const updated = [...localHours];
    updated[idx][field] = val;
    setLocalHours(updated);
  };

  const handleSave = () => {
    onUpdateOperatingHours(localHours);
    setWasSaved(true);
    setTimeout(() => setWasSaved(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Horários de Funcionamento</h2>
          <p className="text-xs text-slate-500 mt-0.5">Defina os dias e horários em que sua clínica estará aberta para agendamentos automáticos.</p>
        </div>
        
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-6 py-2.5 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
          style={{ backgroundColor: customPrimary }}
        >
          {wasSaved ? <Check size={14} /> : <Save size={14} />}
          {wasSaved ? 'Salvo com sucesso' : 'Salvar alterações'}
        </button>
      </div>

      {/* Hours rows list cardboard */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs divide-y divide-slate-100 p-2">
        {localHours.map((row, idx) => (
          <div 
            key={row.day} 
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50/40 rounded-2xl transition-all"
          >
            {/* Day name and slider status toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => handleToggleDay(idx)}
                className="focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-350 rounded-lg"
              >
                {row.enabled ? (
                  <ToggleRight size={32} className="text-emerald-500" />
                ) : (
                  <ToggleLeft size={32} className="text-slate-300" />
                )}
              </button>
              <div>
                <span className="text-sm font-bold text-slate-800 capitalize leading-none">{row.day}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {row.enabled ? 'Aberto para agendar' : 'Fechada'}
                </p>
              </div>
            </div>

            {/* Interval Selection Inputs */}
            {row.enabled ? (
              <div className="flex flex-col gap-2 items-end sm:items-start text-right sm:text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase mr-1">Expediente:</span>
                  <input
                    type="time"
                    value={row.start}
                    onChange={(e) => handleChangeTime(idx, 'start', e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-150 rounded-xl text-xs font-mono font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-350"
                  />
                  <span className="text-xs text-slate-400 font-medium font-sans">às</span>
                  <input
                    type="time"
                    value={row.end}
                    onChange={(e) => handleChangeTime(idx, 'end', e.target.value)}
                    className="px-2.5 py-1.5 border border-slate-150 rounded-xl text-xs font-mono font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-350"
                  />
                </div>
                
                {/* Lunch Break Blocker */}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium hover:text-slate-800">
                    <input
                      type="checkbox"
                      checked={!!row.lunchEnabled}
                      onChange={(e) => {
                        const updated = [...localHours];
                        updated[idx].lunchEnabled = e.target.checked;
                        if (e.target.checked) {
                          updated[idx].lunchStart = updated[idx].lunchStart || '12:00';
                          updated[idx].lunchEnd = updated[idx].lunchEnd || '13:00';
                        }
                        setLocalHours(updated);
                      }}
                      className="rounded text-slate-700 focus:ring-slate-400 w-3.5 h-3.5"
                    />
                    <span>Horário de Almoço (Bloquear)</span>
                  </label>
                  
                  {row.lunchEnabled && (
                    <div className="flex items-center gap-1.5 animate-fade-in pl-2 border-l border-slate-250 select-none">
                      <input
                        type="time"
                        value={row.lunchStart || '12:00'}
                        onChange={(e) => {
                          const updated = [...localHours];
                          updated[idx].lunchStart = e.target.value;
                          setLocalHours(updated);
                        }}
                        className="px-2 py-1.5 border border-slate-150 rounded-xl text-[11px] font-mono font-medium text-slate-700 bg-white focus:outline-none"
                      />
                      <span className="text-[10px] text-slate-400 font-sans">às</span>
                      <input
                        type="time"
                        value={row.lunchEnd || '13:00'}
                        onChange={(e) => {
                          const updated = [...localHours];
                          updated[idx].lunchEnd = e.target.value;
                          setLocalHours(updated);
                        }}
                        className="px-2 py-1.5 border border-slate-150 rounded-xl text-[11px] font-mono font-medium text-slate-700 bg-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="px-5 py-1.5 bg-red-50 text-red-500 font-bold border border-red-100/30 rounded-full text-[10px] uppercase font-mono">
                Fechado
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
