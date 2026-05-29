import React, { useState } from 'react';
import { ClinicSettings, Service, OperatingHour, Professional, Appointment, formatPhone, formatCurrency } from '../types';
import { Calendar as CalendarIcon, Clock, Check, Phone, MapPin, Sparkles, User, FileText, ChevronLeft, Award } from 'lucide-react';

interface PublicBookingViewProps {
  settings: ClinicSettings;
  services: Service[];
  operatingHours: OperatingHour[];
  professionals: Professional[];
  onConfirmBooking: (bookingData: {
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    serviceId: string;
    professionalId: string;
    date: string;
    time: string;
    value: number;
  }) => void;
}

export default function PublicBookingView({
  settings,
  services,
  operatingHours,
  professionals,
  onConfirmBooking,
}: PublicBookingViewProps) {
  const activeServices = services.filter(s => s.status === 'Ativo' && s.visibleInBooking);
  const activeProfessionals = professionals.filter(p => p.status === 'Ativo');

  const [step, setStep] = useState(1);
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedProfessionalId, setSelectedProfessionalId] = useState(activeProfessionals[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState('');
  
  // Client info state
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [confirmedDetails, setConfirmedDetails] = useState<any>(null);

  const selectedService = services.find(s => s.id === selectedServiceId);
  const selectedProfessional = professionals.find(p => p.id === selectedProfessionalId);

  // Helper to determine closed days and operating slots
  const getDayNameFromDate = (dateStr: string) => {
    const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const d = new Date(dateStr + 'T00:00:00');
    return days[d.getDay()];
  };

  const selectedDayName = getDayNameFromDate(selectedDate);
  const currentDayHours = operatingHours.find(h => h.day === selectedDayName);
  const isClosed = !currentDayHours || !currentDayHours.enabled;

  // Generate morning and afternoon time slots based on operating hours
  const generateTimeSlots = () => {
    if (isClosed || !currentDayHours) return [];
    
    const slots: string[] = [];
    const startH = parseInt(currentDayHours.start.split(':')[0]);
    const endH = parseInt(currentDayHours.end.split(':')[0]);
    
    for (let h = startH; h < endH; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleNextStep = () => {
    if (step === 1 && !selectedServiceId) {
      alert('Por favor, selecione um serviço de tratamento para continuar.');
      return;
    }
    if (step === 2 && !selectedTime) {
      alert('Por favor, escolha um horário disponível da lista.');
      return;
    }
    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim()) {
      alert('Por favor, preencha o seu nome e telefone WhatsApp.');
      return;
    }

    const price = selectedService ? selectedService.price : 0;
    
    onConfirmBooking({
      clientName,
      clientPhone,
      clientEmail,
      serviceId: selectedServiceId,
      professionalId: selectedProfessionalId,
      date: selectedDate,
      time: selectedTime,
      value: price,
    });

    setConfirmedDetails({
      serviceName: selectedService?.name,
      professionalName: selectedProfessional?.name,
      date: selectedDate,
      time: selectedTime,
    });
    setBookingConfirmed(true);
  };

  // Theme primary color helper
  const primaryColor = settings.customPrimary || '#6366f1';

  if (bookingConfirmed && confirmedDetails) {
    const formattedDate = new Date(confirmedDetails.date + 'T00:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return (
      <div 
        className="min-h-screen flex flex-col justify-center items-center p-4 font-sans transition-all duration-300"
        style={{ backgroundColor: settings.customBackground || '#f8fafc' }}
      >
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden animate-fade-in p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-550 flex items-center justify-center text-white shadow-lg shadow-emerald-550/20">
            <Check size={32} strokeWidth={3} className="text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-slate-800">Agendamento Confirmado!</h2>
            <p className="text-xs text-slate-500 font-medium">Seu horário foi reservado com sucesso e incluído na agenda.</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 text-left text-xs space-y-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-450 block">Serviço</span>
              <span className="font-bold text-slate-800 text-sm capitalize">{confirmedDetails.serviceName}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Data</span>
                <span className="font-semibold text-slate-800 capitalize">{formattedDate.replace('-feira', '')}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Horário</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{confirmedDetails.time}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-450 block">Profissional</span>
              <span className="font-semibold text-slate-700 capitalize">{confirmedDetails.professionalName}</span>
            </div>

            {settings.address && (
              <div className="border-t pt-2.5 mt-1 border-slate-200/50">
                <span className="text-[10px] uppercase font-bold text-slate-450 block">Endereço de Atendimento</span>
                <span className="text-slate-600 leading-relaxed font-sans">{settings.address}</span>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2">
            <a 
              href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}?text=Olá! Acabei de realizar um agendamento online de ${confirmedDetails.serviceName} para o dia ${confirmedDetails.date} às ${confirmedDetails.time}.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Phone size={14} /> Falar WhatsApp com Clínica
            </a>
            
            <button
              onClick={() => {
                setStep(1);
                setSelectedServiceId('');
                setSelectedTime('');
                setClientName('');
                setClientPhone('');
                setClientEmail('');
                setClientNotes('');
                setBookingConfirmed(false);
                setConfirmedDetails(null);
              }}
              className="w-full py-3 bg-slate-100 hover:bg-slate-150 text-slate-600 rounded-2xl font-bold text-xs transition"
            >
              Fazer outro Agendamento
            </button>
          </div>

          <div className="border-t pt-4 border-slate-100 flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Award size={13} className="text-indigo-400" />
            <span>Leonel CRM · Sistema de Estética</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen py-10 px-4 font-sans flex flex-col items-center transition-all duration-300"
      style={{ backgroundColor: settings.customBackground || '#f8fafc' }}
    >
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden font-sans">
        
        {/* Banner header with Dynamic colors */}
        <div className="p-8 text-center text-white space-y-3 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40 pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <span className="mx-auto inline-flex p-2 bg-white/10 rounded-full backdrop-blur-md">
              <Sparkles size={20} className="text-amber-300" />
            </span>
            <h1 className="text-2xl font-black tracking-tight leading-tight capitalize">{settings.name || 'Clínica de Estética'}</h1>
            {settings.description ? (
              <p className="text-xs text-white/90 max-w-sm mx-auto font-sans font-medium">{settings.description}</p>
            ) : (
              <p className="text-xs text-white/90 max-w-sm mx-auto font-sans">Agende seu horário online em poucos cliques de forma rápida.</p>
            )}
          </div>
        </div>

        {/* Info Strip (Address / WhatsApp) */}
        {(settings.address || settings.whatsapp) && (
          <div 
            className="border-b border-slate-100 py-3 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-[10px] text-slate-500 font-medium"
            style={{ backgroundColor: settings.customSecondary || '#faf9f6' }}
          >
            {settings.address && (
              <span className="flex items-center gap-1">
                <MapPin size={12} className="text-slate-400 shrink-0" />
                <span className="truncate max-w-[220px]" title={settings.address}>{settings.address}</span>
              </span>
            )}
            {settings.whatsapp && (
              <span className="flex items-center gap-1">
                <Phone size={12} className="text-emerald-500 shrink-0" />
                <span>WhatsApp: {settings.whatsapp}</span>
              </span>
            )}
          </div>
        )}

        {/* Flow indicator step bar */}
        <div className="flex border-b border-slate-50">
          <div className={`flex-1 py-3 text-center text-[10px] font-bold border-b-2 ${step === 1 ? 'border-slate-800 text-slate-800 bg-slate-50/40' : 'border-transparent text-slate-400'}`}>
            1. Serviço
          </div>
          <div className={`flex-1 py-3 text-center text-[10px] font-bold border-b-2 ${step === 2 ? 'border-slate-800 text-slate-800 bg-slate-50/40' : 'border-transparent text-slate-400'}`}>
            2. Data e Hora
          </div>
          <div className={`flex-1 py-3 text-center text-[10px] font-bold border-b-2 ${step === 3 ? 'border-slate-800 text-slate-800 bg-slate-50/40' : 'border-transparent text-slate-400'}`}>
            3. Seus Dados
          </div>
        </div>

        {/* Content Body based on active step */}
        <div className="p-8">
          
          {/* STEP 1: CHOOSE SERVICE */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">O que você deseja realizar hoje?</h3>
                <p className="text-[11px] text-slate-455">Selecione o tratamento ou procedimento desejado da nossa lista.</p>
              </div>

              {activeServices.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Nenhum serviço está disponível para agendamento online no momento.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1 no-scrollbar">
                  {activeServices.map((s) => {
                    const isSelected = selectedServiceId === s.id;
                    return (
                      <div 
                        key={s.id} 
                        onClick={() => setSelectedServiceId(s.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-center ${
                          isSelected 
                            ? 'bg-slate-50/50' 
                            : 'border-slate-150 bg-white hover:border-slate-300'
                        }`}
                        style={{ borderColor: isSelected ? primaryColor : undefined }}
                      >
                        <div className="space-y-1">
                          <p className="font-bold text-slate-800 capitalize text-xs">{s.name}</p>
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
                            <Clock size={11} /> {s.duration} min
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-slate-900 font-extrabold text-sm">R$ {s.price.toFixed(2)}</span>
                          <span 
                            className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-all text-white"
                            style={{ 
                              backgroundColor: isSelected ? primaryColor : '#ffffff',
                              borderColor: isSelected ? primaryColor : '#cbd5e1'
                            }}
                          >
                            {isSelected && <span className="text-[9px] font-bold">✓</span>}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {activeServices.length > 0 && (
                <div className="pt-4">
                  <button
                    onClick={handleNextStep}
                    disabled={!selectedServiceId}
                    className="w-full py-3 text-white rounded-2xl text-xs font-bold font-sans tracking-wide transition shadow-sm disabled:opacity-50 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Escolher Agenda e Profissional →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: CHOOSE DATE & TIME */}
          {step === 2 && (
            <div className="space-y-5">
              
              {/* Back selector link */}
              <button 
                onClick={handlePrevStep}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={12} /> Editar Serviço Selecionado ({selectedService?.name})
              </button>

              <div className="space-y-4">
                {/* Select Professional */}
                {activeProfessionals.length > 1 && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escolher Profissional</label>
                    <select
                      value={selectedProfessionalId}
                      onChange={(e) => setSelectedProfessionalId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none"
                    >
                      {activeProfessionals.map(p => (
                        <option key={p.id} value={p.id}>{p.name} - {p.role}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Select Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Escolher Data</label>
                    <div className="relative">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => {
                          setSelectedDate(e.target.value);
                          setSelectedTime('');
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  {/* Closed and Day indicator status */}
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col justify-center text-[10px] select-none">
                    <span className="font-bold text-slate-600 block mb-0.5">{selectedDayName}</span>
                    {isClosed ? (
                      <span className="text-rose-500 font-bold block">Clínica fechada hoje</span>
                    ) : (
                      <span className="text-slate-450 block">Funcionamento: {currentDayHours?.start} às {currentDayHours?.end}</span>
                    )}
                  </div>
                </div>

                {/* Available Hours list */}
                {!isClosed && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Horários Disponíveis Hoje</label>
                    {timeSlots.length === 0 ? (
                      <p className="text-[11px] text-slate-400 italic">Nenhum horário disponível para a data selecionada.</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2 max-h-[150px] overflow-y-auto pr-1 no-scrollbar">
                        {timeSlots.map((time) => {
                          const isSelectedSlot = selectedTime === time;
                          return (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              style={{ borderColor: isSelectedSlot ? primaryColor : '', color: isSelectedSlot ? primaryColor : '' }}
                              className={`py-2 text-center font-bold text-xs rounded-xl border font-mono tracking-wide transition-all cursor-pointer ${
                                isSelectedSlot 
                                  ? 'bg-indigo-50/30 font-extrabold' 
                                  : 'border-slate-150 text-slate-600 bg-white hover:border-slate-350 hover:bg-slate-50/50'
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isClosed && selectedTime && (
                <div className="pt-4">
                  <button
                    onClick={handleNextStep}
                    className="w-full py-3 text-white rounded-2xl text-xs font-bold font-sans tracking-wide transition shadow-sm cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Confirmar Meus Dados de Contato →
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: FILL IN CONTAC DETAILS */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Back link */}
              <button 
                type="button"
                onClick={handlePrevStep}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={12} /> Editar Data & Horário ({selectedTime} · {selectedDate})
              </button>

              <div className="space-y-2.5">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Insira seus dados para contato</h3>
                  <p className="text-[11px] text-slate-455">Utilizaremos essas informações para confirmar seu agendamento e enviar lembretes.</p>
                </div>

                <div className="space-y-3">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">SEU NOME COMPLETO *</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
                        placeholder="Ex: Ana Souza"
                      />
                    </div>
                  </div>

                  {/* Phone WhatsApp */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">SEU CELULAR WHATSAPP *</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="tel"
                        required
                        value={clientPhone}
                        onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                        onFocus={(e) => e.target.select()}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none focus:ring-1 focus:ring-slate-350 font-mono"
                        placeholder="Ex: (48) 99888-7711"
                      />
                    </div>
                  </div>

                  {/* Email address */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">SEU EMAIL (OPCIONAL)</label>
                    <div className="relative">
                      <FileText size={13} className="absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none"
                        placeholder="Ex: ana.souza@email.com"
                      />
                    </div>
                  </div>

                  {/* Notes / Observations */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono">OBSERVAÇÕES ADICIONAIS (OPCIONAL)</label>
                    <textarea
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-750 focus:outline-none"
                      placeholder="Algum detalhe importante que gostaria de adiantar?"
                    />
                  </div>
                </div>

                <div className="pt-4 space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-[10px]">
                    <div>
                      <span className="text-slate-450 block font-sans font-medium">Procedimento Selecionado:</span>
                      <span className="font-bold text-slate-750 uppercase text-[9px]">{selectedService?.name}</span>
                    </div>
                    <span className="text-slate-900 font-extrabold text-xs">R$ {selectedService?.price.toFixed(2)}</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 text-white rounded-2xl text-xs font-bold font-sans tracking-wide transition shadow-sm cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Confirmar e Agendar Horário 🌸
                  </button>
                </div>
              </div>
            </form>
          )}

        </div>
      </div>
      
      {/* Footer System Credits */}
      <span className="text-[10px] text-slate-400 mt-6 select-none flex items-center gap-1">
        <span>Sistema de agendamento seguro fornecido por</span>
        <strong className="text-slate-500 font-semibold font-sans">Leonel CRM</strong>
      </span>
    </div>
  );
}
