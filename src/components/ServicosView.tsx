import React, { useState } from 'react';
import { Service, ThemePreset, formatCurrency } from '../types';
import { Edit2, Trash2, ToggleLeft, ToggleRight, Sparkles, Plus } from 'lucide-react';

interface ServicosViewProps {
  services: Service[];
  theme: ThemePreset;
  customPrimary: string;
  onOpenNewService: () => void;
  onToggleServiceVisibility: (id: string) => void;
  onDeleteService: (id: string) => void;
  onEditService: (srv: Service) => void;
}

export default function ServicosView({
  services,
  theme,
  customPrimary,
  onOpenNewService,
  onToggleServiceVisibility,
  onDeleteService,
  onEditService,
}: ServicosViewProps) {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Serviços</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os procedimentos, preços e durações oferecidos pela sua clínica.</p>
        </div>
        <button
          onClick={onOpenNewService}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 self-start md:self-center cursor-pointer"
          style={{ backgroundColor: customPrimary }}
        >
          <Plus size={14} /> Novo serviço
        </button>
      </div>

      {/* Services Listing */}
      {services.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xs text-xs text-slate-400 italic">
          Nenhum serviço cadastrado. clique em "+ Novo serviço" para começar.
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(srv => (
            <div
              key={srv.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/10"
            >
              {/* Service details */}
              <div className="flex items-center gap-3">
                <span 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs"
                  style={{ backgroundColor: `${customPrimary}1a`, color: customPrimary }}
                >
                  <Sparkles size={16} />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-800 capitalize">{srv.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                      srv.status === 'Ativo' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {srv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {formatCurrency(srv.price)} · {srv.duration} min
                  </p>
                </div>
              </div>

              {/* Toggles & Edit Actions */}
              <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-3 md:pt-0">
                {/* Visibility Slider */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Visível no agendamento</span>
                  <button
                    onClick={() => onToggleServiceVisibility(srv.id)}
                    className="focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-slate-300 rounded-lg text-slate-500 hover:text-slate-700"
                  >
                    {srv.visibleInBooking ? (
                      <ToggleRight size={28} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={28} className="text-slate-300" />
                    )}
                  </button>
                </div>

                {/* Edit & Delete Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onEditService(srv)}
                    className="p-2 border border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 size={12} className="text-slate-400" /> Editar
                  </button>
                  <button
                    onClick={() => onDeleteService(srv.id)}
                    className="p-2 border border-slate-100 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 size={12} /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
