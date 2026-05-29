import React from 'react';
import { ThemePreset, PlanFeatures } from '../types';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';

interface PlanosViewProps {
  theme: ThemePreset;
  customPrimary: string;
  currentPlan: string;
  pricing: { Grátis: number; Profissional: number; Clínica: number };
  onSelectPlan: (planName: string) => void;
  pendingPlanRequest?: string;
  planFeatures: Record<string, PlanFeatures>;
}

export default function PlanosView({ theme, customPrimary, currentPlan, pricing, onSelectPlan, pendingPlanRequest, planFeatures }: PlanosViewProps) {
  const plans = [
    {
      name: 'Grátis',
      price: pricing.Grátis || 0,
      period: 'para sempre',
      description: 'Ideal para profissionais autônomos iniciando na estética.',
      features: [
        `Até ${planFeatures['Grátis']?.maxAppointmentsMonth || 5} agendamentos no mês`,
        `Até ${planFeatures['Grátis']?.maxClients || 15} clientes cadastrados`,
        `Até ${planFeatures['Grátis']?.maxProfessionals || 1} colaborador(es)`,
        'Histórico clínico simples',
        'Página pública básica',
        planFeatures['Grátis']?.allowFinance ? 'Módulo financeiro incluso' : 'Sem módulo financeiro',
        planFeatures['Grátis']?.allowStock ? 'Módulo de estoque incluso' : 'Sem controle de estoque'
      ]
    },
    {
      name: 'Profissional',
      price: pricing.Profissional || 67,
      period: '/mês',
      description: 'Perfeito para quem trabalha sozinho e quer agenda cheia sem limites.',
      features: [
        planFeatures['Profissional']?.maxAppointmentsMonth >= 9999 ? 'Agendamentos ilimitados' : `Até ${planFeatures['Profissional']?.maxAppointmentsMonth} agendamentos/mês`,
        planFeatures['Profissional']?.maxClients >= 9999 ? 'Clientes ilimitados' : `Até ${planFeatures['Profissional']?.maxClients || 100} clientes`,
        planFeatures['Profissional']?.maxProfessionals >= 9999 ? 'Colaboradores ilimitados' : `Até ${planFeatures['Profissional']?.maxProfessionals || 2} colaborador(es)`,
        planFeatures['Profissional']?.allowFinance ? 'Módulo financeiro em tempo real' : 'Sem módulo financeiro',
        planFeatures['Profissional']?.allowWhatsAppTemplates ? 'Disparo de mensagens WhatsApp' : 'Mensagens manuais',
        'Página pública personalizável'
      ]
    },
    {
      name: 'Clínica',
      price: pricing.Clínica || 147,
      period: '/mês',
      description: 'A solução definitiva para clínicas organizarem sua equipe e escala.',
      features: [
        planFeatures['Clínica']?.maxAppointmentsMonth >= 9999 ? 'Agendamentos ilimitados' : `Até ${planFeatures['Clínica']?.maxAppointmentsMonth} agendamentos/mês`,
        planFeatures['Clínica']?.maxClients >= 9999 ? 'Clientes ilimitados' : `Até ${planFeatures['Clínica']?.maxClients || 9999} clientes`,
        planFeatures['Clínica']?.maxProfessionals >= 9999 ? 'Colaboradores ilimitados' : `Até ${planFeatures['Clínica']?.maxProfessionals || 9999} colaboradores`,
        planFeatures['Clínica']?.allowMultiAgenda ? 'Múltiplas agendas integradas' : 'Agenda individual',
        planFeatures['Clínica']?.allowAbsences ? 'Bloqueio de agenda e ausências' : 'Agenda simples',
        'Suporte prioritário via WhatsApp'
      ]
    }
  ];

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Title Header */}
      <div className="text-center max-w-xl mx-auto py-4 space-y-2 font-sans">
        <span className="px-3 py-1 bg-indigo-50 text-indigo-500 font-bold border border-indigo-200 rounded-full text-[10px] uppercase font-mono tracking-wider inline-block">Planos e Assinatura</span>
        <h2 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Escolha a escala ideal para o seu negócio</h2>
        <p className="text-xs text-slate-500">Sem taxas de setup, cancele ou mude de plano a qualquer momento com apenas um clique.</p>
      </div>

      {/* Grid structure */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {plans.map((p) => {
          const isCurrent = currentPlan.toLowerCase() === p.name.toLowerCase();
          const isPending = pendingPlanRequest === p.name;
          
          return (
            <div 
              key={p.name} 
              className={`bg-white rounded-3xl p-6 border transition-all flex flex-col justify-between relative ${
                isCurrent 
                  ? 'border-[2px]' 
                  : 'border-slate-100 hover:shadow-md'
              }`}
              style={{ borderColor: isCurrent ? customPrimary : '' }}
            >
              {p.name === 'Profissional' && (
                <span 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"
                  style={{ backgroundColor: customPrimary }}
                >
                  <Sparkles size={11} /> Mais Vendido
                </span>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">{p.name}</h3>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-2xl font-bold font-sans text-slate-800">
                      {p.price === 0 ? 'Grátis' : `R$ ${p.price.toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-slate-400">{p.period}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">{p.description}</p>
                </div>

                {/* Bullet Features list */}
                <ul className="space-y-2 pt-4 border-t border-slate-50 text-xs text-slate-600">
                  {p.features.map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-emerald-500 mt-0.5"><Check size={14} /></span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Subscribe trigger button */}
              <div className="pt-6 mt-6 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => onSelectPlan(p.name)}
                  disabled={isCurrent || isPending}
                  className="w-full py-2.5 rounded-full text-xs font-semibold transition-all cursor-pointer font-sans"
                  style={{ 
                    backgroundColor: (isCurrent || isPending) ? '#f1f5f9' : customPrimary,
                    color: isCurrent ? '#94a3b8' : isPending ? '#d97706' : '#ffffff' 
                  }}
                >
                  {isCurrent ? 'Plano Atual' : isPending ? 'Solicitado (Aguardando Ativação) ⏳' : `Mudar para ${p.name}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
