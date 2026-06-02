import React from 'react';
import { Professional, Absence, ThemePreset } from '../types';
import { Calendar, UserCheck, Shield, Plus, FileText, Ban, Trash2 } from 'lucide-react';

interface EquipeViewProps {
  professionals: Professional[];
  theme: ThemePreset;
  customPrimary: string;
  onOpenNewProfessional: () => void;
  onOpenNewAbsence: () => void;
  onDeleteAbsence: (profId: string, absId: string) => void;
  onEditProfessional: (prof: Professional) => void;
  onDeleteProfessional: (id: string) => void;
  onToggleLoginStatus: (id: string, email?: string, password?: string) => void;
  allowAbsences: boolean;
  onShowUpgradeModal: (featureName: string) => void;
}

export default function EquipeView({
  professionals,
  theme,
  customPrimary,
  onOpenNewProfessional,
  onOpenNewAbsence,
  onDeleteAbsence,
  onEditProfessional,
  onDeleteProfessional,
  onToggleLoginStatus,
  allowAbsences,
  onShowUpgradeModal,
}: EquipeViewProps) {
  const [loginModalProf, setLoginModalProf] = React.useState<Professional | null>(null);
  const [loginEmail, setLoginEmail] = React.useState('');
  const [loginPassword, setLoginPassword] = React.useState('');

  const handleOpenLoginModal = (prof: Professional) => {
    setLoginModalProf(prof);
    setLoginEmail(prof.loginEmail || '');
    setLoginPassword(prof.loginPassword || '');
  };

  const handleSaveLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginModalProf) return;
    onToggleLoginStatus(loginModalProf.id, loginEmail, loginPassword);
    setLoginModalProf(null);
  };

  const handleDisableLogin = (profId: string) => {
    onToggleLoginStatus(profId, undefined, undefined);
    setLoginModalProf(null);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Equipe</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os profissionais de saúde e estética e configure ausências programadas.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={() => {
              if (allowAbsences) {
                onOpenNewAbsence();
              } else {
                onShowUpgradeModal('Controle de Ausências e Bloqueio de Horários');
              }
            }}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold shadow-xs transition-colors cursor-pointer border ${
              allowAbsences
                ? 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
            }`}
          >
            🚫 Definir ausência
          </button>
          <button
            type="button"
            onClick={onOpenNewProfessional}
            className="px-4 py-2.5 rounded-full text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 cursor-pointer"
            style={{ backgroundColor: customPrimary }}
          >
            + Adicionar colaborador
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                <th className="py-4 px-6">Profissional</th>
                <th className="py-4 px-6">Função</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Login e Configurações</th>
                <th className="py-4 px-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              {professionals.filter(p => !p.deleted).length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                    Sem profissional cadastrado
                  </td>
                </tr>
              ) : (
                professionals.filter(p => !p.deleted).map(prof => (
                  <tr key={prof.id} className="hover:bg-slate-50/20">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center uppercase">
                          {prof.name.charAt(0)}
                        </span>
                        <span className="font-bold text-slate-700 capitalize">{prof.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 capitalize">{prof.role}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                        prof.status === 'Ativo' ? 'bg-emerald-50 text-emerald-500' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {prof.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {prof.loginCreated ? (
                        <button
                          onClick={() => handleOpenLoginModal(prof)}
                          className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 max-w-fit px-2 py-1 rounded-md hover:bg-emerald-100 transition-colors cursor-pointer"
                          title="Clique para editar credenciais"
                        >
                          <Shield size={11} /> Habilitado ({prof.loginEmail || 'Sem email'})
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenLoginModal(prof)}
                          className="px-2.5 py-1 text-[10px] font-bold text-slate-600 border border-slate-100 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        >
                          Habilitar Login / Permissões
                        </button>
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => onEditProfessional(prof)}
                          className="px-2.5 py-1.5 border border-slate-100 text-[10px] font-semibold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => onDeleteProfessional(prof.id)}
                          className="px-2.5 py-1.5 border border-red-100 text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors cursor-pointer"
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absences Section Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5 border-b pb-2">
          <Ban size={15} className="text-red-400" />
          Ausências Programadas / Bloqueios de Agenda
        </h3>

        {professionals.filter(p => !p.deleted).every(p => p.absences.length === 0) ? (
          <p className="text-xs text-slate-400 italic">Nenhum bloqueio ou ausência cadastrada atualmente.</p>
        ) : (
          <div className="space-y-3">
            {professionals.filter(p => !p.deleted).flatMap(p => 
              p.absences.map(abs => (
                <div key={abs.id} className="p-4 rounded-2xl bg-[#FAF7F6] border border-slate-100 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800 capitalize">{p.name}</span>
                      <span className="px-2 py-0.5 bg-amber-50 rounded-full text-[9px] text-amber-600 font-semibold font-mono">
                        {abs.reason}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      Início: {new Date(abs.startDate + 'T00:00:00').toLocaleDateString('pt-BR')} as {abs.startTime} · Fim: {new Date(abs.endDate + 'T00:00:00').toLocaleDateString('pt-BR')} as {abs.endTime}
                    </p>
                  </div>

                  <button
                    onClick={() => onDeleteAbsence(p.id, abs.id)}
                    title="Excluir ausência"
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Modal de cadastro de login */}
      {loginModalProf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-xl space-y-4 mx-4 animate-scale-in">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Habilitar Acesso para {loginModalProf.name}</h3>
              <p className="text-[11px] text-slate-500 mt-1">Defina o e-mail e a senha que o profissional utilizará para acessar o sistema.</p>
            </div>

            <form onSubmit={handleSaveLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">E-mail do Colaborador</label>
                <input
                  type="email"
                  required
                  placeholder="exemplo@clinica.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-1 focus:ring-slate-300 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Senha de Acesso</label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:ring-1 focus:ring-slate-300 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs opacity-95 hover:opacity-100 transition-opacity cursor-pointer"
                  style={{ backgroundColor: customPrimary }}
                >
                  Confirmar e Habilitar
                </button>

                {loginModalProf.loginCreated && (
                  <button
                    type="button"
                    onClick={() => handleDisableLogin(loginModalProf.id)}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Desabilitar Login
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setLoginModalProf(null)}
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
