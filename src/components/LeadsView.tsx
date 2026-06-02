import React, { useState } from 'react';
import { Lead, LeadStage, Service, ThemePreset, formatCurrency, formatPhone, formatDecimalDisplay, parseDecimalFromInput } from '../types';
import { Columns, Check, Phone, ArrowLeft, ArrowRight, Plus, Trash2, Edit, Mail, FileText, UserCheck, CalendarPlus, Search, HelpCircle } from 'lucide-react';

interface LeadsViewProps {
  leads: Lead[];
  services: Service[];
  theme: ThemePreset;
  customPrimary: string;
  onAddLead: (lead: Omit<Lead, 'id' | 'tenantId' | 'createdAt'>) => void;
  onUpdateLeadStage: (id: string, newStage: LeadStage) => void;
  onUpdateLead: (id: string, updatedFields: Partial<Lead>) => void;
  onDeleteLead: (id: string) => void;
  onConvertToClientAndSchedule: (lead: Lead) => void;
}

export default function LeadsView({
  leads,
  services,
  theme,
  customPrimary,
  onAddLead,
  onUpdateLeadStage,
  onUpdateLead,
  onDeleteLead,
  onConvertToClientAndSchedule,
}: LeadsViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null);
  
  // Search state
  const [leadSearch, setLeadSearch] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stage, setStage] = useState<LeadStage>('novo');
  const [value, setValue] = useState(0);
  const [interestServiceId, setInterestServiceId] = useState('');
  const [notes, setNotes] = useState('');

  const stages: { key: LeadStage; label: string; bg: string; text: string; border: string }[] = [
    { key: 'novo', label: 'Novo Lead 📥', bg: 'bg-blue-50/50', text: 'text-blue-700', border: 'border-blue-100' },
    { key: 'negociacao', label: 'Em Negociação 💬', bg: 'bg-amber-50/50', text: 'text-amber-800', border: 'border-amber-100' },
    { key: 'pendente_agendamento', label: 'Link Enviado 🔗', bg: 'bg-purple-50/50', text: 'text-purple-700', border: 'border-purple-100' },
    { key: 'ganho', label: 'Fechado/Ganho 🎉', bg: 'bg-emerald-58/50', text: 'text-emerald-700', border: 'border-emerald-100' },
    { key: 'arquivado', label: 'Perdido/Arquivado 📁', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-150' },
  ];

  const handleOpenNewModal = () => {
    setEditingLeadId(null);
    setName('');
    setPhone('');
    setEmail('');
    setStage('novo');
    setValue(0);
    setInterestServiceId(services[0]?.id || '');
    setNotes('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (l: Lead) => {
    setEditingLeadId(l.id);
    setName(l.name);
    setPhone(l.phone);
    setEmail(l.email);
    setStage(l.stage);
    setValue(l.value);
    setInterestServiceId(l.interestServiceId || '');
    setNotes(l.notes);
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingLeadId) {
      onUpdateLead(editingLeadId, {
        name,
        phone,
        email,
        stage,
        value: Number(value),
        interestServiceId,
        notes,
      });
    } else {
      onAddLead({
        name,
        phone,
        email,
        stage,
        value: Number(value),
        interestServiceId,
        notes,
      });
    }
    setModalOpen(false);
  };

  const handleMoveLeft = (l: Lead) => {
    const currentIndex = stages.findIndex(s => s.key === l.stage);
    if (currentIndex > 0) {
      onUpdateLeadStage(l.id, stages[currentIndex - 1].key);
    }
  };

  const handleMoveRight = (l: Lead) => {
    const currentIndex = stages.findIndex(s => s.key === l.stage);
    if (currentIndex < stages.length - 1) {
      onUpdateLeadStage(l.id, stages[currentIndex + 1].key);
    }
  };

  // Filter leads by search query
  const filteredLeads = leads.filter(l => 
    l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
    l.phone.includes(leadSearch) ||
    (l.notes && l.notes.toLowerCase().includes(leadSearch.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in font-sans">
      
      {/* Title Header with info badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 bg-indigo-55 text-indigo-10 border border-indigo-200/50 rounded-full text-[10px] font-black uppercase tracking-widest font-mono shadow-xs">CRM de Prospecção</span>
            <span className="text-[10px] text-slate-400 font-mono font-bold">PROSPECÇÃO & CONVERSÃO</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight mt-1 font-sans">Funil de Vendas e Leads</h2>
          <p className="text-xs text-slate-500 mt-0.5">Monitore novas indicações, contatos do WhatsApp, tire dúvidas e converta leads frios em clientes agendados.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search box built in right header */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={13} />
            <input
              type="text"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Buscar por lead ou notas..."
              className="pl-9 pr-3 py-2 bg-white border border-slate-150 rounded-full text-xs text-slate-700 w-48 focus:outline-none focus:ring-1 focus:ring-indigo-300 transition-all font-sans"
            />
          </div>

          <button
            onClick={handleOpenNewModal}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold text-white shadow-md shadow-indigo-500/10 cursor-pointer transition hover:opacity-90"
            style={{ backgroundColor: customPrimary }}
          >
            <Plus size={14} /> Novo Lead Manual
          </button>
        </div>
      </div>

      {/* Kanban Info Alert */}
      <div className="p-4 bg-gradient-to-r from-indigo-50/40 to-slate-50 border border-slate-150 rounded-2xl flex items-start gap-3">
        <HelpCircle size={18} className="text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5 text-xs text-slate-650 font-sans leading-relaxed">
          <p className="font-bold text-slate-800">💡 Como funciona este funil de prospecção?</p>
          <p>Cadastre potenciais clientes que entraram em contato mas têm dúvidas. Use o botão <strong className="text-indigo-600">Calendar (📅+)</strong> para convertê-lo automaticamente em cliente cadastrado e abrir o agendamento pré-preenchido.</p>
        </div>
      </div>

      {/* Kanban columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto pb-6 no-scrollbar">
        {stages.map((stg) => {
          const stageLeads = filteredLeads.filter(l => l.stage === stg.key);
          const totalValue = stageLeads.reduce((sum, l) => sum + l.value, 0);

          return (
            <div 
              key={stg.key} 
              className={`rounded-3xl border p-4 flex flex-col min-h-[500px] ${stg.bg} ${stg.border} transition-all`}
            >
              {/* Column header banner */}
              <div className="flex items-center justify-between border-b pb-2 mb-3 border-current/10">
                <span className={`text-[11px] font-bold ${stg.text} capitalize`}>{stg.label}</span>
                <span className={`px-2 py-0.5 text-[9px] font-black rounded-full font-mono ${stg.text} bg-white border border-current/10 shadow-xs`}>
                  {stageLeads.length}
                </span>
              </div>

              {/* Column sum of deal values */}
              {totalValue > 0 && (
                <div className="mb-3 px-2 py-1 bg-white border border-slate-100 rounded-lg flex items-center justify-between text-[10px] text-slate-450 font-mono">
                  <span>Valor Estimado:</span>
                  <span className="font-bold text-indigo-600">{formatCurrency(totalValue)}</span>
                </div>
              )}

              {/* Cards wrapper */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[460px] pr-0.5 no-scrollbar">
                {stageLeads.length === 0 ? (
                  <div className="py-12 border-2 border-dashed border-slate-200/50 rounded-2xl text-center text-[10px] text-slate-400 font-sans">
                    Sem leads nesta etapa.
                  </div>
                ) : (
                  stageLeads.map((l) => {
                    const serv = services.find(s => s.id === l.interestServiceId);
                    return (
                      <div 
                        key={l.id}
                        className="bg-white rounded-2xl p-4 border border-slate-150 hover:border-slate-350 shadow-xs transition-colors hover:shadow-xs group space-y-3 relative overflow-hidden"
                      >
                        {/* Interactive accent stripe on card left side */}
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/20" />
                        
                        <div className="space-y-1">
                          <h4 className="font-bold text-xs text-slate-800 capitalize leading-tight truncate">{l.name}</h4>
                          {l.phone && (
                            <a 
                              href={`https://wa.me/${l.phone.replace(/\D/g, '')}?text=Olá ${l.name}! Tudo bem? Sou da equipe da clínica e estou entrando em contato referente à sua dúvida sobre ${serv?.name || 'procedimentos'}.`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-[10px] text-slate-500 hover:text-emerald-600 flex items-center gap-1 font-mono hover:underline inline-block mt-0.5"
                            >
                              <Phone size={10} className="text-emerald-500" />
                              {formatPhone(l.phone)}
                            </a>
                          )}
                        </div>

                        {/* Interested Service Badge */}
                        {(serv || l.interestServiceId === 'duvidas_consulta') && (
                          <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-100 text-[10px]">
                            <span className="text-slate-500 truncate capitalize max-w-[120px]" title={serv ? serv.name : 'Dúvidas / Consulta Geral'}>
                              {serv ? serv.name : 'Dúvidas / Consulta'}
                            </span>
                            {serv && (
                              <span className="font-mono text-[9px] font-bold text-indigo-650 bg-indigo-50/50 px-1 rounded">
                                {formatCurrency(serv.price)}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Lead notes preview truncated */}
                        {l.notes && (
                          <p className="text-[10px] text-slate-450 font-sans leading-normal italic px-1 line-clamp-2 border-l border-slate-100 pl-1.5" title={l.notes}>
                            {l.notes}
                          </p>
                        )}

                        {/* Card Options / Actions Footer Panel */}
                        <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 mt-2">
                          <div className="flex items-center justify-between gap-1.5">
                            {/* Mover arrows */}
                            <div className="flex gap-1 shrink-0">
                              <button 
                                onClick={() => handleMoveLeft(l)}
                                disabled={stg.key === 'novo'}
                                className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-400 hover:text-slate-700 rounded-md disabled:opacity-30 cursor-pointer"
                                title="Mover para esquerda"
                              >
                                <ArrowLeft size={11} />
                              </button>
                              <button 
                                onClick={() => handleMoveRight(l)}
                                disabled={stg.key === 'arquivado'}
                                className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-150 text-slate-400 hover:text-slate-700 rounded-md disabled:opacity-30 cursor-pointer"
                                title="Mover para direita"
                              >
                                <ArrowRight size={11} />
                              </button>
                            </div>

                            {/* CalendarPlus - Agenda+ Conversion Button */}
                            <button 
                              onClick={() => onConvertToClientAndSchedule(l)}
                              className="flex-1 py-1 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 rounded-md font-bold text-[9px] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                              title="Criar Cliente & Abrir Nova Consulta"
                            >
                              <CalendarPlus size={11} /> Agenda+
                            </button>
                          </div>

                          {/* Secondary utility actions */}
                          <div className="flex items-center justify-end gap-1.5 text-slate-400 text-[10px]">
                            <button 
                              onClick={() => handleOpenEditModal(l)}
                              className="px-2 py-1 flex items-center gap-1 text-[9px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-indigo-50 border border-slate-100 rounded-md cursor-pointer transition-all"
                              title="Editar Lead"
                            >
                              <Edit size={10} /> Editar
                            </button>
                            <button 
                              onClick={() => onDeleteLead(l.id)}
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-55 rounded-md cursor-pointer transition-all animate-none"
                              title="Excluir"
                            >
                              <Trash2 size={10} />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL FORM FOR ADDING / EDITING LEAD */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-3xl border border-slate-100 w-full max-w-md p-6 space-y-4 shadow-2xl animate-fade-in text-left">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                {editingLeadId ? 'Editar Detalhes do Lead' : 'Cadastrar Novo Lead de Prospecção'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-sm w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs text-slate-700">
              {/* Lead Name */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase tracking-wider block">Nome do Lead *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none"
                  placeholder="Ex: Gabriela Ribeiro"
                />
              </div>

              {/* Lead phone & email */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Telefone WhatsApp</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhone(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none"
                    placeholder="Ex: (48) 99122-3344"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none"
                    placeholder="Ex: gabriela@email.com"
                  />
                </div>
              </div>

              {/* Interactive Service alignment and estimated value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Tratamento de Interesse</label>
                  <select
                    value={interestServiceId}
                    onChange={(e) => {
                      setInterestServiceId(e.target.value);
                      if (e.target.value === 'duvidas_consulta') {
                        setValue(0);
                      } else {
                        const srv = services.find(s => s.id === e.target.value);
                        if (srv) setValue(srv.price);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none"
                  >
                    <option value="">Selecione um serviço...</option>
                    <option value="duvidas_consulta">Dúvidas / Consulta Geral</option>
                    {services.filter(s => !s.deleted || s.id === interestServiceId).map(s => (
                      <option key={s.id} value={s.id}>{s.name} - {formatCurrency(s.price)}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Valor Estimado (R$)</label>
                  <input
                    type="text"
                    value={formatDecimalDisplay(value)}
                    onChange={(e) => setValue(parseDecimalFromInput(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none font-mono text-right"
                  />
                </div>
              </div>

              {/* Stage select in modal */}
              {editingLeadId && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Etapa do Funil</label>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value as LeadStage)}
                    className="w-full px-2.5 py-1.8 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none"
                  >
                    {stages.map(s => (
                      <option key={s.key} value={s.key}>{s.label.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* CRM Conversion Notes */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-455 uppercase tracking-widest block font-mono">NOTAS DE NEGOCIAÇÃO / DÚVIDAS DO LEAD</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl focus:outline-none"
                  placeholder="Ex: Entrou em contato pelo Instagram. Tem interesse em peeling químico pós-verão para tirar manchas senis. Respondeu que o preço está bom."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer"
                  style={{ backgroundColor: customPrimary }}
                >
                  {editingLeadId ? 'Salvar Alterações do Lead' : 'Cadastrar Lead no Funil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
