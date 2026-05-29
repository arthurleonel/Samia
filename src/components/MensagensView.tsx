import React, { useState } from 'react';
import { ThemePreset, Client, Appointment, Service } from '../types';
import { Copy, MessageSquare, Check, Phone, Send, Info, User } from 'lucide-react';

interface MensagensViewProps {
  theme: ThemePreset;
  customPrimary: string;
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  allowWhatsAppTemplates: boolean;
  onShowUpgradeModal: (featureName: string) => void;
}

export default function MensagensView({ 
  theme, 
  customPrimary,
  clients,
  appointments,
  services,
  allowWhatsAppTemplates,
  onShowUpgradeModal
}: MensagensViewProps) {
  const [activeTab, setActiveTab] = useState<'confirmacao' | 'lembrete_dia' | 'pos_procedimento'>('confirmacao');
  const [copied, setCopied] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [phoneForWhatsApp, setPhoneForWhatsApp] = useState('48996367442');

  const [confirmTemplate, setConfirmTemplate] = useState(
    `Olá, *{nome_cliente}*! Tudo bem? 🌟\n\nConfirmamos seu agendamento na nossa clínica:\n\n📅 Data: *{data_atendimento}*\n⌛ Horário: *{hora_atendimento}*\n🌿 Procedimento: *{nome_servico}*\n\nCaso precise cancelar ou remarcar, por favor nos avise com antecedência. Estamos ansiosos para te ver! ❤️`
  );

  const [reminderTemplate, setReminderTemplate] = useState(
    `Olá, *{nome_cliente}*! Temos um encontro marcado!\n\nPassando para te lembrar do seu atendimento:\n\n📅 Hoje, *{data_atendimento}*\n⌛ Horário: *{hora_atendimento}*\n🌿 Procedimento: *{nome_servico}*\n\nQualquer dúvida ou imprevisto, responda aqui. Até logo! ✨`
  );

  const [postTemplate, setPostTemplate] = useState(
    `Olá, *{nome_cliente}*! 🥰\n\nComo foi sua experiência com o procedimento *{nome_servico}* de ontem?\n\nQualquer dúvida sobre as recomendações pós-procedimento, conte conosco. Sua opinião e bem-estar são a nossa prioridade! 🌸`
  );

  const getActiveTextTemplate = () => {
    switch (activeTab) {
      case 'confirmacao': return confirmTemplate;
      case 'lembrete_dia': return reminderTemplate;
      case 'pos_procedimento': return postTemplate;
    }
  };

  const getSubstitutedPreview = () => {
    const raw = getActiveTextTemplate();
    const client = clients.find(c => c.id === selectedClientId);
    
    if (client) {
      const clientApts = appointments
        .filter(a => a.clientId === client.id)
        .sort((a, b) => b.date.localeCompare(a.date));
      
      const lastApt = clientApts[0];
      const serviceName = lastApt ? (services.find(s => s.id === lastApt.serviceId)?.name || 'procedimento') : 'procedimento';
      const aptDate = lastApt ? new Date(lastApt.date + 'T00:00:00').toLocaleDateString('pt-BR') : '28/05/2026';
      const aptTime = lastApt ? lastApt.time : '12:00';
      
      return raw
        .replace(/{nome_cliente}/g, client.name)
        .replace(/{data_atendimento}/g, aptDate)
        .replace(/{hora_atendimento}/g, aptTime)
        .replace(/{nome_servico}/g, serviceName);
    }
    
    return raw
      .replace(/{nome_cliente}/g, 'Arthur Leonel')
      .replace(/{data_atendimento}/g, '28/05/2026')
      .replace(/{hora_atendimento}/g, '13:00')
      .replace(/{nome_servico}/g, 'limpeza de pele');
  };

  React.useEffect(() => {
    const client = clients.find(c => c.id === selectedClientId);
    if (client) {
      const cleaned = client.phone.replace(/\D/g, '');
      setPhoneForWhatsApp(cleaned);
    }
  }, [selectedClientId, clients]);

  const clickCopy = () => {
    navigator.clipboard.writeText(getSubstitutedPreview());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendWhatsAppDirectly = () => {
    const cleanPhone = phoneForWhatsApp.replace(/\D/g, '');
    const encodedText = encodeURIComponent(getSubstitutedPreview());
    window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodedText}`, '_blank');
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Modelos de Mensagens</h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">Gere lembretes de agendamentos e textos de pós-venda personalizados para enviar no WhatsApp.</p>
        </div>
        {!allowWhatsAppTemplates && (
          <span className="px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black font-sans flex items-center gap-1 uppercase tracking-wider self-start">
            Plano Profissional
          </span>
        )}
      </div>

      <div className="relative">
        {!allowWhatsAppTemplates && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 backdrop-blur-[2px] rounded-3xl border border-slate-100">
            <div className="max-w-md p-6 bg-white rounded-3xl border border-slate-150 shadow-xl space-y-4">
              <span className="inline-flex p-3 bg-amber-50 rounded-full text-amber-600">
                <MessageSquare size={24} />
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Modelos de WhatsApp Bloqueados</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Automatize confirmações, lembretes de agendamento e pós-atendimento para fidelizar seus clientes. Disponível a partir do plano <strong>Profissional</strong>.
              </p>
              <button
                onClick={() => onShowUpgradeModal('Modelos de WhatsApp e Lembretes de Mensagem')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/10"
              >
                Fazer Upgrade Agora ⚡
              </button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 ${!allowWhatsAppTemplates ? 'blur-[1.5px] pointer-events-none select-none' : ''}`}>
        {/* Templates configurator */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 lg:col-span-2">
          {/* Toggles subheaders */}
          <div className="grid grid-cols-3 bg-slate-100/60 p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab('confirmacao')}
              className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'confirmacao' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500'
              }`}
            >
              Confirmar Reserva
            </button>
            <button
              onClick={() => setActiveTab('lembrete_dia')}
              className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'lembrete_dia' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500'
              }`}
            >
              Lembrete do Dia
            </button>
            <button
              onClick={() => setActiveTab('pos_procedimento')}
              className={`py-2 text-xs font-medium rounded-xl transition-all cursor-pointer ${
                activeTab === 'pos_procedimento' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'text-slate-500'
              }`}
            >
              Pós-Atendimento
            </button>
          </div>

          {/* Editor Body */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">Corpo do modelo (com suporte a markdown)</span>
              <span className="text-[10px] text-slate-400 font-mono">Chaves: {`{nome_cliente}, {data_atendimento}, {hora_atendimento}, {nome_servico}`}</span>
            </div>

            {activeTab === 'confirmacao' && (
              <textarea
                value={confirmTemplate}
                onChange={(e) => setConfirmTemplate(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-slate-350"
              />
            )}
            {activeTab === 'lembrete_dia' && (
              <textarea
                value={reminderTemplate}
                onChange={(e) => setReminderTemplate(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-slate-350"
              />
            )}
            {activeTab === 'pos_procedimento' && (
              <textarea
                value={postTemplate}
                onChange={(e) => setPostTemplate(e.target.value)}
                rows={10}
                className="w-full bg-slate-50 border border-slate-150 rounded-2xl p-4 text-xs text-slate-700 font-sans focus:outline-none focus:ring-1 focus:ring-slate-350"
              />
            )}
          </div>
        </div>

        {/* Live Preview & Direct whatsapp trigger */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between gap-6">
          <div className="space-y-4">
            
            {/* SEARCH AND SELECT CLIENT WIDGET */}
            <div className="space-y-2 border-b pb-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono">Selecionar Cliente</label>
              <div className="relative">
                <User size={12} className="absolute left-3.5 top-3 text-slate-400" />
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-150 bg-slate-50 rounded-xl text-xs text-slate-700 focus:outline-none focus:bg-white"
                >
                  <option value="">-- Simulador: Usar Arthur Leonel --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                  ))}
                </select>
              </div>
            </div>

            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider block border-b pb-2">
              Visualização da Mensagem
            </span>
            {/* Balloon layout resembling WhatsApp message screen */}
            <div className="bg-emerald-50/50 border border-emerald-100/30 p-4 rounded-3xl text-[11px] text-slate-600 font-sans whitespace-pre-wrap leading-relaxed">
              {getSubstitutedPreview()}
            </div>
          </div>

          <div className="space-y-4">
            {/* Copy Button */}
            <button
              onClick={clickCopy}
              className="w-full py-2.5 rounded-full text-xs font-semibold border border-slate-100 text-slate-700 bg-slate-50 hover:bg-slate-150 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? 'Copiado para clipe!' : 'Copiar para a Área de Transferência'}
            </button>

            {/* Direct Send Input box */}
            <div className="space-y-2 border-t pt-4">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Enviar via WhatsApp direto</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Phone size={12} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={phoneForWhatsApp}
                    onChange={(e) => setPhoneForWhatsApp(e.target.value)}
                    placeholder="Celular (Ex: 48996367442)"
                    className="w-full pl-9 pr-2 py-2 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none placeholder:text-slate-300 font-mono"
                  />
                </div>
                <button
                  onClick={sendWhatsAppDirectly}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send size={12} /> Enviar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
