import React, { useState } from 'react';
import { 
  Building2, Users, DollarSign, Award, Grid, ShieldAlert, BadgeHelp, Play, Trash2, Save, LogOut, CheckCircle, Info, Server, Code, FileCode, Check, Settings, RotateCw
} from 'lucide-react';
import { PlanFeatures } from '../types';

interface SuperadminViewProps {
  tenants: any[];
  pricing: { Grátis: number; Profissional: number; Clínica: number };
  onUpdatePricing: (pricing: any) => void;
  onUpdateTenantStatus: (id: string, status: 'Ativo' | 'Suspenso') => void;
  onUpdateTenantPlan: (id: string, plan: string) => void;
  onDeleteTenant: (id: string) => void;
  onImpersonate: (id: string) => void;
  onLogout: () => void;
  planFeatures: Record<string, PlanFeatures>;
  onUpdatePlanFeatures: (features: Record<string, PlanFeatures>) => void;
  onRejectTenantPlanRequest?: (id: string) => void;
  onRefreshData?: () => void;
}

export default function SuperadminView({
  tenants,
  pricing,
  onUpdatePricing,
  onUpdateTenantStatus,
  onUpdateTenantPlan,
  onDeleteTenant,
  onImpersonate,
  onLogout,
  planFeatures,
  onUpdatePlanFeatures,
  onRejectTenantPlanRequest,
  onRefreshData,
}: SuperadminViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pricing states
  const [profPrice, setProfPrice] = useState(pricing.Profissional);
  const [clinicalPrice, setClinicalPrice] = useState(pricing.Clínica);

  // Selected plan features editing state
  const [editingPlanForFeatures, setEditingPlanForFeatures] = useState<string>('Grátis');
  const [featuresDraft, setFeaturesDraft] = useState<PlanFeatures>(() => ({
    maxAppointmentsMonth: 5,
    maxClients: 15,
    maxProfessionals: 1,
    allowClinicalHistory: false,
    allowWhatsAppTemplates: false,
    allowMultiAgenda: false,
    allowAbsences: false,
    allowOnlineBooking: false,
    allowFinance: false,
    allowStock: false,
    allowCRM: false,
    description: '',
    ...planFeatures['Grátis']
  }));

  // Update draft whenever edited plan changes
  const handleSelectPlanToEdit = (planName: string) => {
    setEditingPlanForFeatures(planName);
    setFeaturesDraft({
      maxAppointmentsMonth: 5,
      maxClients: 15,
      maxProfessionals: 1,
      allowClinicalHistory: false,
      allowWhatsAppTemplates: false,
      allowMultiAgenda: false,
      allowAbsences: false,
      allowOnlineBooking: false,
      allowFinance: false,
      allowStock: false,
      allowCRM: false,
      description: '',
      ...(planFeatures[planName] || {})
    });
  };

  const handleUpdateFeaturesDraft = (field: keyof PlanFeatures, value: any) => {
    setFeaturesDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveFeatures = () => {
    onUpdatePlanFeatures({
      ...planFeatures,
      [editingPlanForFeatures]: featuresDraft,
    });
    alert(`Diferenciais e limites do plano "${editingPlanForFeatures}" atualizados com sucesso para todos os usuários!`);
  };

  const handleSavePricing = () => {
    onUpdatePricing({
      'Grátis': 0,
      'Profissional': Number(profPrice),
      'Clínica': Number(clinicalPrice)
    });
    alert('Preços dos planos globais atualizados com sucesso no banco de dados!');
  };

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats calculation
  const totalClinics = tenants.length;
  const activeClinics = tenants.filter(t => t.status === 'Ativo').length;
  const suspendedClinics = tenants.filter(t => t.status === 'Suspenso').length;
  
  const mrr = tenants.reduce((total, t) => {
    if (t.status !== 'Ativo') return total;
    if (t.plan === 'Profissional') return total + (pricing.Profissional || 67);
    if (t.plan === 'Clínica') return total + (pricing.Clínica || 147);
    return total;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none pb-12 animate-fade-in">
      
      {/* Top Admin Navigation Header */}
      <header className="h-16 px-8 border-b border-slate-800 bg-slate-900 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-orange-600 text-white font-black text-sm flex items-center justify-center italic">SA</span>
          <div>
            <h1 className="text-xs font-black tracking-tight uppercase text-white leading-none">Leonel CRM SaaS</h1>
            <span className="text-[8px] text-orange-400 font-bold font-mono uppercase tracking-widest mt-1 block">Superadmin Control Center</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {onRefreshData && (
            <button
              onClick={() => {
                onRefreshData();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-800 rounded-xl text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
              title="Forçar sincronização de dados do servidor"
            >
              <RotateCw size={11} /> Sincronizar
            </button>
          )}
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-mono text-emerald-400 font-bold">
            🟢 Banco Central Ativo (PostgreSQL Ready)
          </span>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl text-[10px] font-bold text-slate-300 transition-all cursor-pointer"
          >
            <LogOut size={12} /> Sair do Painel
          </button>
        </div>
      </header>

      {/* Main Grid Wrapper */}
      <main className="flex-1 p-8 space-y-8 max-w-7xl mx-auto w-full">
        
        {/* Metric Cards Grid Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Total de Clínicas SaaS</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-white">{totalClinics}</span>
              <Building2 className="text-indigo-400" size={20} />
            </div>
            <p className="text-[8px] text-slate-500">Inquilinos de clínica operados localmente.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Assinaturas Ativas</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-400">{activeClinics}</span>
              <CheckCircle className="text-emerald-400" size={20} />
            </div>
            <p className="text-[8px] text-slate-500">Contratos ativos sem bloqueio administrativo.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Faturamento Mensal (MRR)</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-400">R$ {mrr.toFixed(2)}</span>
              <DollarSign className="text-amber-400" size={20} />
            </div>
            <p className="text-[8px] text-slate-500">Projeção recorrente sobre os planos vigentes.</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">Clínicas Suspensas</p>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-400">{suspendedClinics}</span>
              <ShieldAlert className="text-rose-400" size={20} />
            </div>
            <p className="text-[8px] text-slate-500">Por inadimplência ou cancelamento.</p>
          </div>
        </div>

        {/* Content Layout sections (Left: tenants. Right: Configuration and Docker plans) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Tenant list column (left) span 2 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-1.5">
                    ⚙️ Clínicas Assinantes Cadastradas
                  </h2>
                  <p className="text-[10px] text-slate-400 font-sans">Controle de logins, planos contratados e status de operação.</p>
                </div>

                {/* Local search field */}
                <input
                  type="text"
                  placeholder="Buscar por clínica ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3.5 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 w-full sm:w-64 font-sans"
                />
              </div>

              {/* Grid Subscriber list */}
              <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[9px] font-mono tracking-widest font-bold">
                      <th className="py-3 px-4">Clínica / Responsável</th>
                      <th className="py-3 px-4 text-center">Plano</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Ações de Gestão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTenants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-500 italic font-mono text-[10px]">Nenhuma clínica encontrada no banco central.</td>
                      </tr>
                    ) : (
                      filteredTenants.map((t) => (
                        <tr key={t.id} className={`hover:bg-slate-950/40 transition-colors ${t.pendingPlanRequest ? 'bg-amber-500/[0.03]' : ''}`}>
                          <td className="py-3.5 px-4 space-y-0.5">
                            <p className="font-bold text-white text-xs flex items-center gap-1.5">
                              {t.name}
                              {t.pendingPlanRequest && (
                                <span className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-md text-[8px] font-black uppercase tracking-wider font-mono animate-pulse">Solicitação Pendente</span>
                              )}
                            </p>
                            <p className="text-[9px] text-slate-500 font-mono">{t.email} • {t.phone || 'Sem whats'}</p>
                            
                            {t.pendingPlanRequest && (
                              <div className="mt-2 p-2.5 bg-amber-500/10 border border-amber-500/20 text-[10px] rounded-xl flex flex-col gap-1.5 text-left max-w-sm">
                                <div className="text-amber-400 font-extrabold uppercase tracking-wider font-mono flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping inline-block" />
                                  Solicitado: {t.pendingPlanRequest}
                                </div>
                                <p className="text-slate-300 text-[9px] font-sans">O usuário solicitou migração para o plano pago <strong>{t.pendingPlanRequest}</strong>.</p>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onUpdateTenantPlan(t.id, t.pendingPlanRequest);
                                      alert(`Upgrade aceito! A clínica "${t.name}" foi migrada para o plano "${t.pendingPlanRequest}" com sucesso.`);
                                    }}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[8px] uppercase tracking-wider transition cursor-pointer font-mono"
                                  >
                                    Aceitar e Migrar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Deseja recusar a solicitação de upgrade da clínica "${t.name}"?`)) {
                                        onRejectTenantPlanRequest?.(t.id);
                                      }
                                    }}
                                    className="px-2.5 py-1 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold rounded-lg text-[8px] uppercase tracking-wider transition cursor-pointer font-mono"
                                  >
                                    Recusar
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <select
                              value={t.plan}
                              onChange={(e) => onUpdateTenantPlan(t.id, e.target.value)}
                              className="bg-slate-950 text-[10px] text-indigo-400 font-extrabold border border-indigo-500/20 hover:border-indigo-500/50 rounded-lg px-2 py-1 outline-none transition-all"
                            >
                              <option value="Grátis" className="bg-slate-900 text-slate-400 font-bold">Grátis</option>
                              <option value="Profissional" className="bg-slate-900 text-indigo-400 font-bold">Profissional</option>
                              <option value="Clínica" className="bg-slate-900 text-amber-500 font-bold">Clínica</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              onClick={() => onUpdateTenantStatus(t.id, t.status === 'Ativo' ? 'Suspenso' : 'Ativo')}
                              className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest cursor-pointer leading-none transition-all ${
                                t.status === 'Ativo'
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 hover:content-["Suspender"]'
                                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                              }`}
                            >
                              {t.status}
                            </button>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex gap-1.5 items-center justify-center">
                              {/* Impersonation simulation shortcut */}
                              <button
                                onClick={() => onImpersonate(t.id)}
                                className="px-2.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold rounded-lg text-[9px] flex items-center gap-1 cursor-pointer transition-all leading-none uppercase tracking-widest"
                                title="Fazer Login simulado como proprietário do consultório"
                              >
                                <Play size={10} /> Simular Acesso
                              </button>

                              {/* Exclusion simulation button */}
                              <button
                                onClick={() => {
                                  if (confirm(`Excluir permanentemente o banco de dados da clínica ${t.name}?`)) {
                                    onDeleteTenant(t.id);
                                  }
                                }}
                                className="p-1.5 bg-slate-950 text-slate-500 hover:text-red-400 rounded-lg border border-slate-800 hover:border-red-500/20 cursor-pointer"
                                title="Excluir Consultório do Servidor"
                              >
                                <Trash2 size={11} />
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

            
          </div>

          {/* Pricing configuration panel column (right) */}
          <div className="space-y-6">
            
            {/* Plan customizer card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center gap-1.5">
                💵 Customização de Mensalidade SaaS
              </h3>
              <p className="text-[10px] text-slate-400">Preços globais que serão refletidos na central de contratação de todos os inquilinos.</p>

              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Plano Grátis</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-500 font-mono text-xs select-none">
                    R$ 0,00 (Fixo)
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Plano Profissional (R$/Mês)</label>
                  <input
                    type="number"
                    value={profPrice}
                    onChange={(e) => setProfPrice(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">Plano Clínica (R$/Mês)</label>
                  <input
                    type="number"
                    value={clinicalPrice}
                    onChange={(e) => setClinicalPrice(Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSavePricing}
                  className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} /> Atualizar Preços Vigentes
                </button>
              </div>
            </div>

            {/* Feature Customizer Card */}
            <div className="bg-slate-905 border border-slate-800 rounded-3xl p-6 space-y-4">
              <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center gap-1.5 border-b border-slate-800 pb-2.5">
                <Settings size={13} className="text-orange-500" />
                🛠️ Diferenciais dos Planos (Regras)
              </h3>
              <p className="text-[10px] text-slate-400">Configure os limites e funções habilitadas para cada plano. As mudanças afetam instantaneamente todos os assinantes.</p>

              {/* Tab selects for plans */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {['Grátis', 'Profissional', 'Clínica'].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPlanToEdit(p)}
                    className={`py-1.5 text-[9px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                      editingPlanForFeatures === p 
                        ? 'bg-orange-600 text-white' 
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="space-y-3.5 pt-2">
                {/* Max Appointments Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    <span>Limite de Agendamentos / Mês</span>
                    <span className="text-[10px] text-orange-400">{featuresDraft.maxAppointmentsMonth >= 9999 ? 'Ilimitado' : `${featuresDraft.maxAppointmentsMonth} agendamentos`}</span>
                  </div>
                  <input
                    type="number"
                    value={featuresDraft.maxAppointmentsMonth}
                    onChange={(e) => handleUpdateFeaturesDraft('maxAppointmentsMonth', Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full text-xs px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="9999 para ilimitado"
                  />
                </div>

                {/* Max Clients Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    <span>Limite de Clientes Cadastrados</span>
                    <span className="text-[10px] text-orange-400">{featuresDraft.maxClients >= 9999 ? 'Ilimitado' : `${featuresDraft.maxClients} clientes`}</span>
                  </div>
                  <input
                    type="number"
                    value={featuresDraft.maxClients}
                    onChange={(e) => handleUpdateFeaturesDraft('maxClients', Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full text-xs px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="9999 para ilimitado"
                  />
                </div>

                {/* Max Professionals (Colaboradores) Limit */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    <span>Limite de Colaboradores (Profissionais)</span>
                    <span className="text-[10px] text-orange-400">{featuresDraft.maxProfessionals >= 9999 ? 'Ilimitado' : `${featuresDraft.maxProfessionals} colaboradores`}</span>
                  </div>
                  <input
                    type="number"
                    value={featuresDraft.maxProfessionals}
                    onChange={(e) => handleUpdateFeaturesDraft('maxProfessionals', Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                    className="w-full text-xs px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-indigo-500"
                    placeholder="9999 para ilimitado"
                  />
                </div>

                {/* Checkbox features list */}
                <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block pb-1">Funcionalidades Habilitadas:</span>
                  
                  {/* WhatsApp Templates */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowWhatsAppTemplates}
                      onChange={(e) => handleUpdateFeaturesDraft('allowWhatsAppTemplates', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">WhatsApp e Mensagens</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Modelos e envio direto sincronizado</span>
                    </div>
                  </label>

                  {/* Clinical History */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowClinicalHistory}
                      onChange={(e) => handleUpdateFeaturesDraft('allowClinicalHistory', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">Observações e Histórico Clínico</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Fichas de anamnese e evolução</span>
                    </div>
                  </label>

                  {/* Absences */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowAbsences}
                      onChange={(e) => handleUpdateFeaturesDraft('allowAbsences', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">Controle de Ausências</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Bloqueios inteligentes de horário</span>
                    </div>
                  </label>

                  {/* Online Booking */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowOnlineBooking}
                      onChange={(e) => handleUpdateFeaturesDraft('allowOnlineBooking', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">Central de Agendamento Online</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Página pública integrada com o celular</span>
                    </div>
                  </label>

                  {/* Finance module */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowFinance ?? false}
                      onChange={(e) => handleUpdateFeaturesDraft('allowFinance', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">Financeiro e Livro Caixa</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Controle de receitas, despesas e faturamento</span>
                    </div>
                  </label>

                  {/* Stock module */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowStock ?? false}
                      onChange={(e) => handleUpdateFeaturesDraft('allowStock', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">Controle e Auditoria de Estoques</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Gestão de produtos críticos e suprimentos</span>
                    </div>
                  </label>

                  {/* Funil CRM module */}
                  <label className="flex items-center gap-2 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition">
                    <input
                      type="checkbox"
                      checked={featuresDraft.allowCRM ?? false}
                      onChange={(e) => handleUpdateFeaturesDraft('allowCRM', e.target.checked)}
                      className="accent-orange-500 h-3.5 w-3.5 rounded"
                    />
                    <div className="text-[10px]">
                      <span className="font-extrabold text-white block">Funil CRM e Captação</span>
                      <span className="text-slate-500 text-[8px] font-sans font-medium">Gestão de leads, prospecção e funil de conversão</span>
                    </div>
                  </label>
                </div>

                {/* Customizable plan functions description */}
                <div className="space-y-1.5 pt-2.5 border-t border-slate-800/80">
                  <label className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 block">
                    Texto Descritivo do Plano (Funções)
                  </label>
                  <textarea
                    rows={2}
                    value={featuresDraft.description || ''}
                    onChange={(e) => handleUpdateFeaturesDraft('description', e.target.value)}
                    className="w-full text-[11px] px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-sans focus:outline-none focus:border-indigo-500"
                    placeholder="Ex: WhatsApp, 2 colaboradores, 100 clientes..."
                  />
                  <p className="text-[8px] text-slate-500 leading-normal">
                    Este texto será exibido aos clientes no modal de upgrade quando este plano for visualizado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveFeatures}
                  className="w-full mt-2 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save size={13} /> Salvar Recursos do Plano
                </button>
              </div>
            </div>

            {/* Simulated Live status logs widget */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-3.5">
              <h3 className="text-xs font-black uppercase text-white tracking-widest font-mono flex items-center gap-1.5">
                🔔 Atividades Recentes do Saas
              </h3>
              
              <div className="space-y-2.5 text-[9px] font-mono max-h-48 overflow-y-auto pr-0.5 no-scrollbar">
                <p className="text-slate-500">
                  <span className="text-indigo-400">[16:01]</span> Nova clínica <span className="text-slate-300">"Sorella Clínics"</span> contratada no plano Profissional com sucesso.
                </p>
                <p className="text-slate-500">
                  <span className="text-indigo-400">[15:45]</span> Integração PostgreSQL do Servidor de Ingressos re-validada com sucesso.
                </p>
                <p className="text-slate-500">
                  <span className="text-indigo-400">[14:32]</span> Backup sincronizado localmente em volume Docker.
                </p>
                <p className="text-slate-500">
                  <span className="text-indigo-400">[11:15]</span> Clinica Lumini efetuou carregamento de 15 novos agendamentos via API pública.
                </p>
              </div>
            </div>
            
          </div>
        </div>

      </main>
    </div>
  );
}
