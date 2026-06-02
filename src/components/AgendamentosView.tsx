import React, { useState } from 'react';
import { Appointment, Client, Service, Professional, ThemePreset, formatDecimalDisplay, parseDecimalFromInput } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Sparkles, User, CheckCircle, HelpCircle, Trash2 } from 'lucide-react';

interface AgendamentosViewProps {
  appointments: Appointment[];
  clients: Client[];
  services: Service[];
  professionals: Professional[];
  theme: ThemePreset;
  customPrimary: string;
  onOpenNewAppointment: () => void;
  onOpenNewAppointmentWithDate: (date: string) => void;
  onUpdateAppointmentStatus: (id: string, newStatus: Appointment['status']) => void;
  onDeleteAppointment: (id: string) => void;
  onEditAppointment: (id: string, updatedFields: Partial<Appointment>) => void;
}

export default function AgendamentosView({
  appointments,
  clients,
  services,
  professionals,
  theme,
  customPrimary,
  onOpenNewAppointment,
  onOpenNewAppointmentWithDate,
  onUpdateAppointmentStatus,
  onDeleteAppointment,
  onEditAppointment,
}: AgendamentosViewProps) {
  const [viewType, setViewType] = useState<'Mês' | 'Semana' | 'Dia'>('Mês');
  const todayDate = new Date();
  const [currentYear, setCurrentYear] = useState<number>(todayDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(todayDate.getMonth());

  // Edit mode tracking states
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editServiceId, setEditServiceId] = useState('');
  const [editProfessionalId, setEditProfessionalId] = useState('');
  const [editStatus, setEditStatus] = useState<Appointment['status']>('Pendente');
  const [editValue, setEditValue] = useState<number>(30);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const monthLabel = `${monthNames[currentMonth]} ${currentYear}`;

  // Helper selectors
  const getClient = (id: string) => clients.find(c => c.id === id) || { name: 'Cliente', phone: '' };
  const getService = (id: string) => services.find(s => s.id === id) || { name: 'Serviço', price: 0 };
  const getProfessional = (id: string) => professionals.find(p => p.id === id) || { name: 'Profissional' };

  // Dynamically generate calendar days grid (6 weeks = 42 cells)
  const generateDynamicCalendarDays = () => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const prevMonthDaysList = [];
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthLastDay - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      prevMonthDaysList.push({ dayNumber: dayNum, month: 'prev' as const, dateString });
    }

    const currMonthDaysList = [];
    const currMonthLastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    for (let i = 1; i <= currMonthLastDay; i++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      currMonthDaysList.push({ dayNumber: i, month: 'curr' as const, dateString });
    }

    const nextMonthDaysList = [];
    const totalCells = 42;
    const remaining = totalCells - (prevMonthDaysList.length + currMonthDaysList.length);
    for (let i = 1; i <= remaining; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateString = `${y}-${String(m + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      nextMonthDaysList.push({ dayNumber: i, month: 'next' as const, dateString });
    }

    return [...prevMonthDaysList, ...currMonthDaysList, ...nextMonthDaysList];
  };

  const calendarDays = generateDynamicCalendarDays();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Detail Modal popup on clicking an appointment cell item
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);

  return (
    <div className="space-y-6 pb-12">
      {/* Title Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Agendamentos</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os horários e atendimentos da sua clínica.</p>
        </div>
        <button
          onClick={onOpenNewAppointment}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 self-start md:self-center cursor-pointer"
          style={{ backgroundColor: customPrimary }}
        >
          <span className="text-sm font-bold">+</span> Novo agendamento
        </button>
      </div>

      {/* Navigation and views bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation arrow buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button 
            onClick={handleGoToToday}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hoje
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-xl border border-slate-100 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <span className="text-sm font-semibold text-slate-700 ml-2">{monthLabel}</span>
        </div>

        {/* Mês, Semana, Dia toggles */}
        <div className="bg-slate-100/60 p-1.5 rounded-2xl flex items-center gap-1 self-start md:self-auto">
          {(['Mês', 'Semana', 'Dia'] as const).map(option => (
            <button
              key={option}
              onClick={() => setViewType(option)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                viewType === option
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      {viewType === 'Mês' ? (
        /* Calendar month grid exactly matching May 2026 UI */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {weekdays.map(day => (
              <div key={day} className="py-3 text-center text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>

          {/* Day squares */}
          <div className="grid grid-cols-7 grid-rows-6 auto-rows-fr divide-x divide-y divide-slate-100">
            {calendarDays.map((cell, idx) => {
              const dayApts = appointments.filter(a => a.date === cell.dateString);
              // Check if cell is active day of chosen date YYYY-MM-DD
              const isToday = cell.dateString === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  onClick={() => onOpenNewAppointmentWithDate(cell.dateString)}
                  className={`h-[120px] max-h-[120px] p-2 flex flex-col justify-between transition-colors hover:bg-slate-50/50 cursor-pointer overflow-hidden ${
                    cell.month !== 'curr' ? 'bg-slate-100/40 text-slate-300' : 'bg-white text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold w-5 h-5 flex items-center justify-center rounded-full ${
                      isToday 
                        ? 'text-white' 
                        : cell.month !== 'curr' ? 'text-slate-400' : 'text-slate-700'
                    }`}
                    style={isToday ? { backgroundColor: customPrimary } : {}}>
                      {cell.dayNumber}
                    </span>
                    {dayApts.length > 0 && cell.month === 'curr' && (
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: customPrimary }} />
                    )}
                  </div>

                  {/* List of scheduling inside current day cell */}
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 pb-0.5 space-y-1 flex-1 overflow-y-auto max-h-[76px] pr-0.5 flex flex-col justify-start scrollbar-thin w-full"
                  >
                    {dayApts.map(apt => {
                      const cli = getClient(apt.clientId);
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent trigger day add popup
                            setSelectedApt(apt);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 border transition-all hover:shadow-xs hover:border-slate-350 cursor-pointer shrink-0 flex items-center gap-1 h-[22px] min-h-[22px] w-full overflow-hidden"
                          style={{ 
                            backgroundColor: apt.status === 'Confirmado' ? '#eef2ff' : '#FAF7F6',
                            borderColor: apt.status === 'Confirmado' ? '#c7d2fe' : '#e2e8f0', 
                            borderLeftWidth: '3px',
                            borderLeftColor: apt.status === 'Confirmado' ? '#6366f1' : customPrimary
                          }}
                        >
                          <span className="font-mono shrink-0">{apt.time}</span>
                          <span className="capitalize truncate flex-1 min-w-0" title={cli.name}>{cli.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Weekly/Daily simple fallback view with gorgeous modern timeline visual */
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-1.5">
            <CalendarIcon size={16} style={{ color: customPrimary }} />
            {viewType === 'Semana' ? 'Timeline da Semana' : 'Timeline do Dia'}
          </h3>
          <div className="space-y-4">
            {appointments.map(apt => {
              const cli = getClient(apt.clientId);
              const srv = getService(apt.serviceId);
              const prof = getProfessional(apt.professionalId);

              return (
                <div key={apt.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div className="text-center min-w-[70px] border-r border-slate-150 pr-4">
                    <p className="font-mono text-sm font-bold text-slate-800">{apt.time}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{apt.date}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-extrabold text-slate-700 capitalize">{cli.name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium ${
                        apt.status === 'Confirmado' ? 'bg-indigo-50 text-indigo-500' :
                        apt.status === 'Finalizado' ? 'bg-emerald-50 text-emerald-500' :
                        apt.status === 'Ausente' ? 'bg-amber-50 text-amber-500' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {apt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 capitalize">{srv.name} (R$ {srv.price.toFixed(2)})</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Profissional: <span className="font-medium text-slate-500">{prof.name}</span></p>
                  </div>
                  <div className="flex flex-col justify-center gap-1.5">
                    <button
                      onClick={() => onUpdateAppointmentStatus(apt.id, 'Confirmado')}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-[10px] font-medium text-indigo-600 rounded-lg border border-slate-150 transition-colors"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => onDeleteAppointment(apt.id)}
                      className="px-2.5 py-1 bg-white hover:bg-red-50 text-[10px] font-medium text-red-600 rounded-lg border border-slate-150 transition-colors"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Appointment click Details tooltip modal popover */}
      {selectedApt && (() => {
        const client = getClient(selectedApt.clientId);
        const service = getService(selectedApt.serviceId);
        const professional = getProfessional(selectedApt.professionalId);
        const historyApts = appointments.filter(a => a.clientId === selectedApt.clientId && a.id !== selectedApt.id);

        const sendWhatsAppConfirmation = () => {
          const dateFormatted = new Date(selectedApt.date + 'T00:00:00').toLocaleDateString('pt-BR');
          const text = `Olá, *${client.name}*! Tudo bem? 🌸\nConfirmamos seu agendamento para procedimento de *${service.name}* no dia *${dateFormatted}* às *${selectedApt.time}*.\n\nQualquer dúvida ou alteração, por favor nos avise. Até breve!`;
          const cleanPhone = client.phone.replace(/\D/g, '');
          window.open(`https://api.whatsapp.com/send?phone=55${cleanPhone}&text=${encodeURIComponent(text)}`, '_blank');
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b pb-3 shrink-0">
                <h3 className="text-sm font-bold text-slate-800">
                  {isEditing ? 'Editar Agendamento' : 'Detalhes do Agendamento'}
                </h3>
                <button 
                  onClick={() => {
                    setSelectedApt(null);
                    setIsEditing(false);
                    setDeleteConfirmId(null);
                  }} 
                  className="text-slate-400 hover:text-slate-600 text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Container Body */}
              <div className="space-y-4 py-4 overflow-y-auto no-scrollbar flex-1 text-xs">
                {isEditing ? (
                  // EDIT MODE FORM CONTENT
                  <div className="space-y-3 font-sans">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Data (AAAA-MM-DD)</label>
                        <input 
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Horário</label>
                        <input 
                          type="text"
                          placeholder="Ex: 14:00"
                          value={editTime}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 4) {
                              val = val.slice(0, 4);
                            }
                            if (val.length > 2) {
                              val = `${val.slice(0, 2)}:${val.slice(2)}`;
                            }
                            setEditTime(val);
                          }}
                          onBlur={(e) => {
                            let val = e.target.value.trim();
                            const digits = val.replace(/\D/g, '');
                            if (digits.length === 4) {
                              val = `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
                            } else if (digits.length === 3) {
                              val = `0${digits.slice(0, 1)}:${digits.slice(1, 3)}`;
                            } else if (digits.length > 0 && digits.length <= 2) {
                              val = `${digits.padStart(2, '0')}:00`;
                            }
                            if (/^\d{2}:\d{2}$/.test(val)) {
                              setEditTime(val);
                            }
                          }}
                          onFocus={(e) => {
                            const target = e.target;
                            setTimeout(() => {
                              try {
                                target.select();
                              } catch (err) {}
                            }, 50);
                          }}
                          onClick={(e) => {
                            try {
                              (e.target as HTMLInputElement).select();
                            } catch (err) {}
                          }}
                          className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white outline-none font-mono font-semibold"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Serviço / Tratamento</label>
                      <select
                        value={editServiceId}
                        onChange={(e) => {
                          setEditServiceId(e.target.value);
                          const chosenSrv = services.find(s => s.id === e.target.value);
                          if (chosenSrv) setEditValue(chosenSrv.price);
                        }}
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white outline-none"
                      >
                        {services.filter(s => !s.deleted || s.id === editServiceId).map(s => (
                          <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Profissional / Colaborador</label>
                      <select
                        value={editProfessionalId}
                        onChange={(e) => setEditProfessionalId(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white outline-none"
                      >
                        {professionals.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Valor cobrado (R$)</label>
                        <input
                          type="text"
                          value={formatDecimalDisplay(editValue)}
                          onChange={(e) => setEditValue(parseDecimalFromInput(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white outline-none font-mono text-right"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Status</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as Appointment['status'])}
                          className="w-full px-3 py-2 border border-slate-100 bg-slate-50 rounded-xl focus:bg-white outline-none"
                        >
                          <option value="Pendente">Pendente</option>
                          <option value="Confirmado">Confirmado</option>
                          <option value="Ausente">Ausente</option>
                          <option value="Finalizado">Finalizado</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ) : (
                  // DETAILS DISPLAY & HISTORY MODE
                  <div className="space-y-4 font-sans">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center gap-2 text-slate-600">
                        <User size={13} className="text-slate-400" />
                        <span className="font-extrabold text-slate-800 capitalize text-xs">
                          {client.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {client.phone}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <Sparkles size={13} className="text-slate-400" />
                        <span className="capitalize">{service.name}</span>
                        <span className="text-slate-500 font-semibold font-mono">(R$ {(selectedApt.value || service.price).toFixed(2)})</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={13} className="text-slate-400" />
                        <span className="font-mono">{new Date(selectedApt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {selectedApt.time}</span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-600">
                        <CheckCircle size={13} className="text-slate-400" />
                        <span className="text-slate-400">Status atual:</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                          selectedApt.status === 'Confirmado' ? 'bg-indigo-50 text-indigo-500' :
                          selectedApt.status === 'Finalizado' ? 'bg-emerald-50 text-emerald-600' :
                          selectedApt.status === 'Ausente' ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {selectedApt.status}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Action and Edit Toggles row */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={sendWhatsAppConfirmation}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer leading-none"
                      >
                        ✉ Enviar Confirmação WhatsApp
                      </button>
                      <button
                        onClick={() => {
                          setEditDate(selectedApt.date);
                          setEditTime(selectedApt.time);
                          setEditServiceId(selectedApt.serviceId);
                          setEditProfessionalId(selectedApt.professionalId);
                          setEditStatus(selectedApt.status);
                          setEditValue(selectedApt.value || 30);
                          setIsEditing(true);
                        }}
                        className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-[10px] cursor-pointer"
                      >
                        Editar Agendamento
                      </button>
                    </div>

                    {/* CLIENT SCHEDULING HISTORY SECTION */}
                    <div className="border-t pt-3.5 space-y-2">
                       <h4 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-extrabold flex items-center justify-between">
                         <span>Histórico do Cliente</span>
                         <span>({historyApts.length} atendimentos)</span>
                       </h4>
                       <div className="max-h-24 overflow-y-auto pr-0.5 space-y-1.5 no-scrollbar">
                         {historyApts.length === 0 ? (
                           <p className="text-[10px] text-slate-400 italic font-mono py-1">Nenhum outro atendimento encontrado.</p>
                         ) : (
                           historyApts.map(hist => {
                             const histSrv = getService(hist.serviceId);
                             return (
                               <div key={hist.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-2">
                                 <div>
                                   <p className="font-bold text-slate-700 capitalize text-[10px]">{histSrv.name}</p>
                                   <p className="text-[8px] text-slate-400 font-mono mt-0.5">{new Date(hist.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {hist.time}</p>
                                 </div>
                                 <span className={`px-1.5 py-0.5 rounded-full text-[7px] font-bold uppercase ${
                                   hist.status === 'Confirmado' ? 'bg-indigo-50 text-indigo-500' :
                                   hist.status === 'Finalizado' ? 'bg-emerald-50 text-emerald-500' :
                                   hist.status === 'Ausente' ? 'bg-amber-50 text-amber-500' : 'bg-slate-200/50 text-slate-400'
                                 }`}>
                                   {hist.status}
                                 </span>
                               </div>
                             );
                           })
                         )}
                       </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="border-t pt-3 flex gap-2 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-100 cursor-pointer"
                    >
                      Voltar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onEditAppointment(selectedApt.id, {
                          date: editDate,
                          time: editTime,
                          serviceId: editServiceId,
                          professionalId: editProfessionalId,
                          status: editStatus,
                          value: editValue
                        });
                        setSelectedApt(prev => prev ? {
                          ...prev,
                          date: editDate,
                          time: editTime,
                          serviceId: editServiceId,
                          professionalId: editProfessionalId,
                          status: editStatus,
                          value: editValue
                        } : null);
                        setIsEditing(false);
                      }}
                      className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white cursor-pointer animate-pulse"
                      style={{ backgroundColor: customPrimary }}
                    >
                      Salvar Dados
                    </button>
                  </>
                ) : (
                  <>
                    {selectedApt.status !== 'Confirmado' && selectedApt.status !== 'Finalizado' && (
                      <button
                        onClick={() => {
                          onUpdateAppointmentStatus(selectedApt.id, 'Confirmado');
                          setSelectedApt(null);
                        }}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Confirmar
                      </button>
                    )}
                    {selectedApt.status !== 'Finalizado' && (
                      <button
                        onClick={() => {
                          onUpdateAppointmentStatus(selectedApt.id, 'Finalizado');
                          setSelectedApt(null);
                        }}
                        className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                      >
                        Finalizar
                      </button>
                    )}
                    {selectedApt.status !== 'Ausente' && selectedApt.status !== 'Finalizado' && (
                      <button
                        onClick={() => {
                          onUpdateAppointmentStatus(selectedApt.id, 'Ausente');
                          setSelectedApt(null);
                        }}
                        className="py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl border border-slate-100 cursor-pointer"
                      >
                        Ausente
                      </button>
                    )}
                    {deleteConfirmId === selectedApt.id ? (
                      <div className="flex gap-1 items-center bg-red-50 p-1 rounded-xl border border-red-100 animate-pulse">
                        <span className="text-[8px] text-red-600 font-bold px-1 select-none">Excluir?</span>
                        <button
                          onClick={() => {
                            onDeleteAppointment(selectedApt.id);
                            setSelectedApt(null);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[8px] font-bold cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-white text-slate-500 rounded-lg text-[8px] font-bold border border-slate-150 cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setDeleteConfirmId(selectedApt.id);
                        }}
                        className="p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl flex items-center justify-center cursor-pointer"
                        title="Excluir Agendamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
