import React from 'react';
import { Appointment, Client, Service, UserAlert, RecentActivity, ThemePreset, PlanFeatures, formatCurrency } from '../types';
import { DollarSign, TrendingUp, Calendar, Sparkles, Users, AlertCircle, Edit2, Check, UserMinus, Trash2 } from 'lucide-react';

interface DashboardViewProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  alerts: UserAlert[];
  activities: RecentActivity[];
  theme: ThemePreset;
  customPrimary: string;
  onNavigateToTab: (tab: string) => void;
  onOpenNewAppointment: () => void;
  onUpdateAppointmentStatus: (id: string, newStatus: Appointment['status']) => void;
  currentPlan: string;
  currentFeatures: PlanFeatures;
  clinicName: string;
}

export default function DashboardView({
  appointments,
  clients,
  services,
  alerts,
  activities,
  theme,
  customPrimary,
  onNavigateToTab,
  onOpenNewAppointment,
  onUpdateAppointmentStatus,
  currentPlan,
  currentFeatures,
  clinicName,
}: DashboardViewProps) {
  // Helpers to get client and service name
  const getClient = (id: string) => clients.find(c => c.id === id) || { name: 'Cliente Desconhecido', phone: '' };
  const getService = (id: string) => services.find(s => s.id === id) || { name: 'Serviço', price: 0 };

  // Date constants matching local date
  const todayStr = new Date().toLocaleDateString('en-CA');

  // Computed values
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const totalFaturamento = appointments
    .filter(a => a.status === 'Confirmado' || a.status === 'Finalizado' || a.status === 'Pendente')
    .reduce((sum, a) => sum + a.value, 0);

  const receitaPrevistaHoje = todayAppointments
    .filter(a => a.status !== 'Ausente')
    .reduce((sum, a) => sum + a.value, 0);

  const totalClientesAtivos = clients.length;
  
  const faltasCount = appointments.filter(a => a.status === 'Ausente').length;
  const taxaFaltas = appointments.length > 0 ? ((faltasCount / appointments.length) * 100).toFixed(1) : '0.0';

  // Last 6 months calculation (real metrics)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return {
      monthLabel: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      monthIndex: d.getMonth(),
      year: d.getFullYear(),
      total: 0
    };
  });

  appointments.forEach(a => {
    if (a.status === 'Confirmado' || a.status === 'Finalizado') {
      const ad = new Date(a.date + 'T12:00:00');
      const am = ad.getMonth();
      const ay = ad.getFullYear();
      const mBucket = last6Months.find(bucket => bucket.monthIndex === am && bucket.year === ay);
      if (mBucket) {
        mBucket.total += a.value;
      }
    }
  });

  const maxMonthValue = Math.max(...last6Months.map(m => m.total), 1);
  const points6Months = last6Months.map((m, i) => {
    const x = 30 + i * 85; // fit in 500px width beautifully
    const ratio = m.total / (maxMonthValue * 1.15);
    const y = 130 - (ratio * 100);
    return { x, y, total: m.total, label: m.monthLabel };
  });

  const areaD = `M ${points6Months[0].x},130 ` + 
    points6Months.map(p => `L ${p.x},${p.y}`).join(' ') + 
    ` L ${points6Months[points6Months.length - 1].x},130 Z`;

  const lineD = `M ` + points6Months.map(p => `${p.x},${p.y}`).join(' L ');

  // Current Week Day calculation (real metrics)
  const getStartOfWeek = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day;
    return new Date(date.setDate(diff));
  };

  const startOfWeek = getStartOfWeek(new Date());
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return {
      dayLabel: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
      dateStr: d.toLocaleDateString('en-CA'),
      count: 0
    };
  });

  appointments.forEach(a => {
    if (a.status !== 'Ausente') {
      const dBucket = daysOfWeek.find(day => day.dateStr === a.date);
      if (dBucket) {
        dBucket.count++;
      }
    }
  });

  const maxDayCount = Math.max(...daysOfWeek.map(d => d.count), 1);

  return (
    <div className="space-y-6 pb-12 overflow-y-auto h-full pr-1">
      {/* Top Banner Subscription Info */}
      {currentPlan === 'Grátis' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Você está no plano gratuito</h3>
            <p className="text-xs text-slate-500 mt-1">
              Agendamentos: <span className="font-semibold text-slate-700">{appointments.length}/{currentFeatures.maxAppointmentsMonth}</span> · Clientes: <span className="font-semibold text-slate-700">{clients.length}/{currentFeatures.maxClients}</span> · Profissionais: <span className="font-semibold text-slate-700">1/{currentFeatures.maxProfessionals}</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Faça upgrade para desbloquear todos os recursos.</p>
          </div>
          <button 
            onClick={() => onNavigateToTab('planos')}
            className="px-6 py-2.5 rounded-full text-xs font-medium text-white transition-opacity hover:opacity-90 self-start md:self-center cursor-pointer"
            style={{ backgroundColor: customPrimary }}
          >
            Ver planos
          </button>
        </div>
      )}

      {/* Greeting Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Olá, {clinicName || 'Gestor'}</h2>
          <p className="text-xs text-slate-500 mt-0.5 capitalize">
            {new Intl.DateTimeFormat('pt-BR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            }).format(new Date())}
          </p>
        </div>
        
        <button
          onClick={onOpenNewAppointment}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 self-start md:self-center cursor-pointer"
          style={{ backgroundColor: customPrimary }}
        >
          <span className="text-sm font-bold">+</span> Novo agendamento
        </button>
      </div>

      {/* Grid of Business metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Faturamento do Mês */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Faturamento (mês)</span>
            <span className="text-emerald-500"><DollarSign size={15} /></span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalFaturamento)}</p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">Total acumulado: {formatCurrency(totalFaturamento)}</p>
          </div>
        </div>

        {/* Lucro Líquido */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Lucro líquido (mês)</span>
            <span className="text-emerald-500"><TrendingUp size={15} /></span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800">{formatCurrency(totalFaturamento)}</p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">Após custos e 0% de impostos</p>
          </div>
        </div>

        {/* Agendamentos Hoje */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Agendamentos hoje</span>
            <span><Calendar size={15} /></span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800">{todayAppointments.length}</p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">
              {todayAppointments.filter(a => a.status === 'Confirmado' || a.status === 'Pendente').length} ativos
            </p>
          </div>
        </div>

        {/* Receita Prevista */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Receita prevista hoje</span>
            <span className="text-indigo-500"><Sparkles size={15} /></span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800 font-sans">{formatCurrency(receitaPrevistaHoje)}</p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">{todayAppointments.length} atendimentos</p>
          </div>
        </div>

        {/* Clientes Ativos (30 dias) */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider">Clientes ativos (30d)</span>
            <span><Users size={15} /></span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-slate-800">{totalClientesAtivos}</p>
            <p className="text-[9px] text-slate-400 truncate mt-0.5">{totalClientesAtivos} cadastrados</p>
          </div>
        </div>

        {/* Taxa de Faltas */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px] bg-red-50/20 border-red-100">
          <div className="flex items-center justify-between text-red-400">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-red-800">Taxa de faltas</span>
            <span><AlertCircle size={15} /></span>
          </div>
          <div className="mt-2">
            <p className="text-lg font-bold text-red-700">{taxaFaltas}%</p>
            <p className="text-[9px] text-red-500 truncate mt-0.5">{faltasCount} faltas registradas</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita últ 6 meses */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Receita dos últimos 6 meses</h3>
          </div>
          {/* Minimalist Line Area Chart (SVG) */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 500 150" fill="none" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={customPrimary} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={customPrimary} stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Grid auxiliary guidelines */}
              <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />

              {/* Filled Area */}
              <path 
                d={areaD} 
                fill="url(#chartGrad)" 
              />
              {/* Stroke Trend line */}
              <path 
                d={lineD} 
                stroke={customPrimary} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
              />

              {/* Interactive Dots for months */}
              {points6Months.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="4" 
                  fill={customPrimary} 
                  stroke="#fff" 
                  strokeWidth="1.5" 
                  title={`R$ ${p.total}`} 
                />
              ))}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-2">
              {last6Months.map((m, i) => (
                <span key={i} className="capitalize">{m.monthLabel}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Semana Atual */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Semana atual</h3>
          </div>
          {/* Minimalist Bar Chart (SVG) */}
          <div className="h-44 w-full relative pt-2">
            <svg className="w-full h-full" viewBox="0 0 500 150" fill="none" preserveAspectRatio="none">
              {/* Horizontal baseline */}
              <line x1="0" y1="130" x2="500" y2="130" stroke="#e2e8f0" strokeWidth="1" />

              {daysOfWeek.map((day, i) => {
                const barWidth = 24;
                const x = 32 + i * 65; // spacing across 500 px
                const barHeight = day.count === 0 ? 2 : Math.max(2, (day.count / maxDayCount) * 110);
                const y = 130 - barHeight;
                const isToday = day.dateStr === todayStr;

                return (
                  <g key={i}>
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={barHeight} 
                      rx="4" 
                      fill={day.count > 0 ? customPrimary : '#cbd5e1'} 
                      className="transition-all hover:opacity-85"
                      opacity={isToday ? 1 : 0.75}
                    />
                    {day.count > 0 && (
                      <text 
                        x={x + barWidth / 2} 
                        y={y - 8} 
                        fill="#334155" 
                        fontSize="9" 
                        fontWeight="700" 
                        textAnchor="middle"
                      >
                        {day.count}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1 px-2">
              {daysOfWeek.map((day, idx) => {
                const isToday = day.dateStr === todayStr;
                return (
                  <span 
                    key={idx} 
                    className={`min-w-[40px] text-center capitalize ${isToday ? 'font-bold' : ''}`}
                    style={isToday ? { color: customPrimary } : undefined}
                  >
                    {day.dayLabel}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid of details: Próximos Atendimentos, Alertas, Atividades */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Próximos Atendimentos */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-50 pb-2">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Próximos atendimentos</h4>
            <span 
              onClick={() => onNavigateToTab('agendamentos')} 
              className="text-[10px] hover:underline cursor-pointer"
              style={{ color: customPrimary }}
            >
              Ver agenda
            </span>
          </div>
          {todayAppointments.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">Nenhum atendimento agendado hoje.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map(item => {
                const client = getClient(item.clientId);
                const service = getService(item.serviceId);
                return (
                  <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-colors">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1.5 bg-slate-100 rounded-xl text-slate-700">
                      {item.time}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 capitalize">{client.name}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{service.name}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Aniversariantes da semana */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4 text-center flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-2 text-left">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Aniversariantes da semana</h4>
          </div>
          <div className="py-6 flex flex-col items-center justify-center text-slate-400">
            <div className="text-3xl mb-1">🎂</div>
            <p className="text-xs text-slate-500">Nenhum aniversariante esta semana</p>
          </div>
          <div />
        </div>

        {/* Alertas */}
        <div className="bg-[#FAF7F6] p-5 rounded-3xl border border-amber-100/50 shadow-xs space-y-4">
          <div className="flex items-center gap-1.5 border-b border-amber-100/30 pb-2">
            <span className="text-amber-500">🔔</span>
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Alertas</h4>
          </div>
          <div className="space-y-3">
            {alerts.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="flex gap-2.5">
                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${item.type === 'danger' ? 'bg-red-400' : 'bg-blue-400'}`} />
                <div>
                  <p className="text-xs font-bold text-slate-700">{item.title}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Serviços mais realizados & Top profissionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs text-center py-10">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left border-b border-slate-50 pb-2 mb-4">Serviços mais realizados</h4>
          <p className="text-xs text-slate-400 italic">Sem dados ainda</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs text-center py-10">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-left border-b border-slate-50 pb-2 mb-4">Top profissionais</h4>
          <p className="text-xs text-slate-400 italic">Sem dados ainda</p>
        </div>
      </div>

      {/* Atividades Recentes */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b border-slate-50 pb-2">Atividades recentes</h4>
        <div className="space-y-3">
          {activities.map((item, idx) => (
            <div key={`${item.id}-${idx}`} className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50/50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-slate-700 text-[11px] font-sans">{item.text}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{item.timeAgo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Atendimentos de hoje (Full Table) */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-slate-50">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Atendimentos de hoje</h4>
          <span 
            onClick={() => onNavigateToTab('agendamentos')} 
            className="text-[10px] hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: customPrimary }}
          >
            Ver todos <span>→</span>
          </span>
        </div>
        
        {todayAppointments.length === 0 ? (
          <div className="p-10 text-center text-xs text-slate-400 italic">Não há atendimentos cadastrados para hoje.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                  <th className="py-3 px-6">Horário</th>
                  <th className="py-3 px-6">Cliente</th>
                  <th className="py-3 px-6">Serviço</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {todayAppointments.map(apt => {
                  const client = getClient(apt.clientId);
                  const service = getService(apt.serviceId);
                  
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-6 font-mono font-medium text-slate-700">{apt.time}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-[10px] text-slate-500 flex items-center justify-center font-bold capitalize">
                            {client.name.charAt(0)}
                          </span>
                          <span className="font-semibold text-slate-700 capitalize">{client.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-500 capitalize">{service.name}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                          apt.status === 'Confirmado' ? 'bg-indigo-50 text-indigo-500' :
                          apt.status === 'Finalizado' ? 'bg-emerald-50 text-emerald-500' :
                          apt.status === 'Ausente' ? 'bg-amber-50 text-amber-500' :
                          'bg-amber-100/50 text-amber-700'
                        }`}>
                          {apt.status}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          {/* Confirm action button */}
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'Confirmado')}
                            title="Confirmar Agendamento"
                            className="p-1 rounded-md text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-colors"
                          >
                            <Check size={14} />
                          </button>
                          {/* Finalize action button */}
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'Finalizado')}
                            title="Finalizar Atendimento"
                            className="p-1 rounded-md text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors"
                          >
                            <Sparkles size={14} />
                          </button>
                          {/* Absent action button */}
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'Ausente')}
                            title="Marcar como Ausente"
                            className="p-1 rounded-md text-slate-400 hover:text-amber-500 hover:bg-amber-50 transition-colors"
                          >
                            <UserMinus size={14} />
                          </button>
                          {/* Delete/Delete-Pendente */}
                          <button
                            onClick={() => onUpdateAppointmentStatus(apt.id, 'Pendente')}
                            title="Voltar para Pendente"
                            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
