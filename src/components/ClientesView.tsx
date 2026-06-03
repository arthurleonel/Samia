import React, { useState } from 'react';
import { Client, Appointment, Service, formatCurrency, formatPhone } from '../types';
import { Search, UserPlus, Phone, Calendar, History, ArrowLeft, DollarSign, Activity, FileText, Trash2 } from 'lucide-react';

interface ClientesViewProps {
  clients: Client[];
  appointments: Appointment[];
  services: Service[];
  theme: any;
  customPrimary: string;
  onOpenNewClient: () => void;
  onOpenNewAppointmentWithClient: (clientId: string) => void;
  allowClinicalHistory: boolean;
  onShowUpgradeModal: (featureName: string) => void;
  onDeleteClient: (id: string) => void;
}

export default function ClientesView({
  clients,
  appointments,
  services,
  theme,
  customPrimary,
  onOpenNewClient,
  onOpenNewAppointmentWithClient,
  allowClinicalHistory,
  onShowUpgradeModal,
  onDeleteClient,
}: ClientesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientProfile, setSelectedClientProfile] = useState<Client | null>(null);

  // Search filter
  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get service name/price
  const getService = (id: string) => services.find(s => s.id === id) || { name: 'Serviço', price: 0 };

  // Profile calculations
  const getClientHistory = (clientId: string) => {
    return appointments
      .filter(a => a.clientId === clientId)
      .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  };

  const getClientStats = (clientId: string) => {
    const clientApts = appointments.filter(a => a.clientId === clientId);
    const concluídos = clientApts.filter(a => a.status === 'Finalizado' || a.status === 'Confirmado');
    const totalGasto = concluídos.reduce((sum, a) => sum + a.value, 0);

    const checkins = clientApts.filter(a => a.status === 'Finalizado');
    const ultimaVisita = checkins.length > 0 
      ? checkins.sort((a, b) => b.date.localeCompare(a.date))[0].date 
      : 'Nenhuma visita finalizada';

    return {
      totalGasto,
      concluidosCount: concluídos.length,
      ultimaVisita
    };
  };

  if (selectedClientProfile) {
    const client = selectedClientProfile;
    const history = getClientHistory(client.id);
    const stats = getClientStats(client.id);

    return (
      <div className="space-y-6 pb-12">
        {/* Back Button */}
        <div>
          <button
            onClick={() => setSelectedClientProfile(null)}
            className="flex items-center gap-1.5 px-4 py-2 border border-slate-100 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer bg-white"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
        </div>

        {/* Profile Header */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <span 
                className="w-16 h-16 rounded-full text-white text-2xl font-bold flex items-center justify-center uppercase"
                style={{ backgroundColor: customPrimary }}
              >
                {client.name.charAt(0)}
              </span>
              <div>
                <h3 className="text-xl font-bold text-slate-800 capitalize leading-tight">{client.name}</h3>
                <p className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-1.5">
                  <span className="text-slate-400">📞</span> {formatPhone(client.phone)}
                </p>
                <p className="text-xs text-slate-400 font-mono mt-0.5">✉️ {client.email}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">Nascimento</p>
              <p className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                {client.birthdate ? new Date(client.birthdate + 'T00:00:00').toLocaleDateString('pt-BR') : '--'}
              </p>
            </div>
          </div>

          {client.notes && (
            <div className="mt-5 pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                <FileText size={13} style={{ color: customPrimary }} />
                Observações clínicas / preferências
              </p>
              <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-2xl italic">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Top Mini cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Spend */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <DollarSign size={12} /> Total gasto
            </span>
            <p className="text-lg font-bold text-slate-800 mt-2">{formatCurrency(stats.totalGasto)}</p>
          </div>

          {/* Appointments concluded */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Activity size={12} /> Atendimentos concluídos
            </span>
            <p className="text-lg font-bold text-slate-800 mt-2">{stats.concluidosCount}</p>
          </div>

          {/* Last Visit */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col justify-between min-h-[100px]">
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1">
              <Calendar size={12} /> Última visita
            </span>
            <p className="text-md font-bold text-slate-800 mt-2 font-mono">
              {stats.ultimaVisita !== 'Nenhuma visita finalizada'
                ? new Date(stats.ultimaVisita + 'T00:00:00').toLocaleDateString('pt-BR')
                : '--'}
            </p>
          </div>
        </div>

        {/* Histórico Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Histórico de atendimentos</h4>
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center text-xs text-slate-400 italic">Nenhum atendimento registrado para este paciente.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-400 font-mono text-[9px] uppercase tracking-wider border-b border-slate-100">
                    <th className="py-3 px-6">Data</th>
                    <th className="py-3 px-6">Serviço</th>
                    <th className="py-3 px-6">Profissional</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {history.map(item => {
                    const srv = getService(item.serviceId);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/20">
                        <td className="py-4 px-6 font-mono text-slate-600">
                          {new Date(item.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {item.time}
                        </td>
                        <td className="py-4 px-6 font-semibold text-slate-800 capitalize">{srv.name}</td>
                        <td className="py-4 px-6 text-slate-400">--</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            item.status === 'Confirmado' ? 'bg-indigo-50 text-indigo-500' :
                            item.status === 'Finalizado' ? 'bg-emerald-50 text-emerald-500' :
                            item.status === 'Ausente' ? 'bg-amber-50 text-amber-500' :
                            'bg-amber-100/50 text-amber-600'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-mono font-bold text-slate-700">{formatCurrency(item.value)}</td>
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-800 tracking-tight">Pacientes</h2>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie os perfis dos seus pacientes, observações clínicas e históricos.</p>
        </div>
        <button
          onClick={onOpenNewClient}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium text-white shadow-sm transition-opacity hover:opacity-90 self-start md:self-center cursor-pointer"
          style={{ backgroundColor: customPrimary }}
        >
          <span className="text-sm font-bold">+</span> Novo paciente
        </button>
      </div>

      {/* Search Input Card */}
      <div className="relative">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
        <input
          type="text"
          placeholder="Buscar paciente..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-xs text-slate-700 shadow-xs focus:outline-none focus:ring-1 focus:ring-slate-350"
        />
      </div>

      {/* Customer Listing */}
      {filteredClients.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-100 shadow-xs text-xs text-slate-400 italic">
          Nenhum paciente cadastrado
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map(client => (
            <div 
              key={client.id}
              className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:bg-slate-50/30"
            >
              <div className="flex items-center gap-3">
                <span 
                  className="w-10 h-10 rounded-full text-white text-xs font-bold font-sans flex items-center justify-center uppercase"
                  style={{ backgroundColor: customPrimary }}
                >
                  {client.name.charAt(0)}
                </span>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 capitalize">{client.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{formatPhone(client.phone)}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenNewAppointmentWithClient(client.id)}
                  className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-[10px] font-semibold text-slate-600 rounded-xl border border-slate-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Calendar size={12} className="text-slate-400" /> Agendar
                </button>
                <button
                  onClick={() => {
                    if (allowClinicalHistory) {
                      setSelectedClientProfile(client);
                    } else {
                      onShowUpgradeModal('Histórico de Atendimento e Observações Clínicas');
                    }
                  }}
                  className={`px-4 py-2 text-[10px] font-semibold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                    allowClinicalHistory 
                      ? 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-100' 
                      : 'bg-white hover:bg-slate-50 text-slate-500 border-slate-150'
                  }`}
                >
                  <History size={12} className="text-slate-400" />
                  Histórico
                </button>
                <button
                  onClick={() => onDeleteClient(client.id)}
                  className="p-2 border border-rose-100 text-rose-500 hover:text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer flex items-center justify-center font-bold"
                  title="Excluir Paciente"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
