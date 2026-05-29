import React from 'react';
import { ClinicSettings, ThemePreset, Service, OperatingHour } from '../types';
import { THEME_PRESETS } from '../initialData';
import { Smartphone, Check, Copy, ExternalLink, Sliders, Image as ImageIcon, MapPin, Eye } from 'lucide-react';

interface PaginaPublicaViewProps {
  settings: ClinicSettings;
  services: Service[];
  operatingHours: OperatingHour[];
  currentTheme: ThemePreset;
  customPrimary: string;
  customSecondary: string;
  customBackground: string;
  onUpdateSettings: (newSettings: Partial<ClinicSettings>) => void;
  onSaveSettings?: (currentSettings: ClinicSettings) => void;
  onCopyBookingLink: () => void;
  copiedLink: boolean;
  allowOnlineBooking: boolean;
  onShowUpgradeModal: (featureName: string) => void;
  bookingUrl: string;
}

export default function PaginaPublicaView({
  settings,
  services,
  operatingHours,
  currentTheme,
  customPrimary,
  customSecondary,
  customBackground,
  onUpdateSettings,
  onSaveSettings,
  onCopyBookingLink,
  copiedLink,
  allowOnlineBooking,
  onShowUpgradeModal,
  bookingUrl,
}: PaginaPublicaViewProps) {
  
  const [selectedDay, setSelectedDay] = React.useState('Sexta-feira');
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Update selected preset and map its colors
  const handleSelectPreset = (preset: ThemePreset) => {
    onUpdateSettings({
      selectedThemeId: preset.id,
      customPrimary: preset.primary,
      customSecondary: preset.secondary,
      customBackground: preset.background,
    });
  };

  const activeServices = services.filter(s => s.status === 'Ativo' && s.visibleInBooking);

  return (
    <div className="space-y-6 pb-12 animate-fade-in relative">
      {savedSuccess && (
        <div id="settings-save-success" className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 shadow-xs animate-slide-in">
          <div className="p-1 rounded-full bg-emerald-500 text-white shrink-0 mt-0.5">
            <Check size={14} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-emerald-800 font-sans">Alterações salvas com sucesso!</h4>
            <p className="text-[11px] text-emerald-600 mt-0.5 font-sans">
              As informações da clínica e as opções de tema foram confirmadas e salvas. O link público de agendamento online foi atualizado e já reflete suas preferências!
            </p>
          </div>
          <button 
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="text-emerald-500 hover:text-emerald-750 text-xs font-bold font-sans cursor-pointer focus:outline-none"
          >
            ✕
          </button>
        </div>
      )}

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold text-slate-800 tracking-tight font-sans">Página Pública de Agendamento</h2>
            {!allowOnlineBooking && (
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[9px] font-black uppercase tracking-wider font-sans">
                Plano Profissional
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Customize informações de contato, temas visuais e confira a prévia de agendamento dos seus clientes.</p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              if (allowOnlineBooking) {
                onCopyBookingLink();
              } else {
                onShowUpgradeModal('Link de Agendamento Online Público');
              }
            }}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
              allowOnlineBooking 
                ? 'border-slate-150 hover:bg-slate-50 bg-white' 
                : 'border-slate-200 hover:bg-slate-50 bg-white text-slate-600'
            }`}
          >
            {copiedLink ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            {copiedLink ? 'Link copiado!' : 'Copiar link de agendamento'}
          </button>

          {allowOnlineBooking && (
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-semibold border border-indigo-150 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 transition-colors cursor-pointer shadow-xs font-sans"
            >
              <ExternalLink size={14} />
              Acessar Link Público
            </a>
          )}
        </div>
      </div>

      <div className="relative">
        {!allowOnlineBooking && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-8 text-center bg-slate-50/70 backdrop-blur-[2px] rounded-3xl border border-slate-100">
            <div className="max-w-md p-6 bg-white rounded-3xl border border-slate-150 shadow-xl space-y-4">
              <span className="inline-flex p-3 bg-amber-50 rounded-full text-amber-600">
                <Smartphone size={24} />
              </span>
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Agendamento Online Bloqueado</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Permita que seus clientes agendem horários 24 horas por dia através de uma página pública personalizada e integrada diretamente ao seu calendário. Disponível a partir do plano <strong>Profissional</strong>.
              </p>
              <button
                onClick={() => onShowUpgradeModal('Agendamento Online Público')}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-500/10 font-sans"
              >
                Fazer Upgrade Agora ⚡
              </button>
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${!allowOnlineBooking ? 'blur-[1.5px] pointer-events-none select-none' : ''}`}>
        {/* Settings column */}
        <div className="space-y-6 lg:col-span-8">
          {/* Clinic Details Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-2">Informações da Clínica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Clinic Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nome da Clínica / Profissional</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => onUpdateSettings({ name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-350"
                  placeholder="Ex: Samia Estética"
                />
              </div>

              {/* WhatsApp Contact */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Celular WhatsApp comercial</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => onUpdateSettings({ whatsapp: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-350"
                  placeholder="Ex: (48) 99636-7442"
                />
              </div>

              {/* Clinic Description */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Descrição ou Slogan</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => onUpdateSettings({ description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-350"
                  placeholder="Digite uma breve apresentação que aparecerá no link de agendamentos."
                />
              </div>

              {/* Clinic Address */}
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Endereço Físico Completo</label>
                <div className="relative">
                  <MapPin size={12} className="absolute left-3 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => onUpdateSettings({ address: e.target.value })}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-350"
                    placeholder="Rua, número, bairro, cidade, estado"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Color & Theme Picker Customizer */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-2 flex items-center gap-1">
              <Sliders size={14} className="text-slate-400" /> Personalização Visual
            </h3>

            {/* Presets Grid Selection */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Modelos / Temas Prontos</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = settings.selectedThemeId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'border-[2px] shadow-sm' 
                          : 'border-slate-100 hover:border-slate-300'
                      }`}
                      style={{ 
                        borderColor: isSelected ? preset.primary : '',
                        backgroundColor: preset.background 
                      }}
                    >
                      <span className="text-[11px] font-bold text-slate-700">{preset.name}</span>
                      <div className="flex gap-1.5 mt-2">
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.primary }} />
                        <span className="w-4 h-4 rounded-full border border-white" style={{ backgroundColor: preset.secondary }} />
                      </div>
                      {isSelected && (
                        <span 
                          className="absolute bottom-2 right-2 w-4 h-4 rounded-full text-white flex items-center justify-center text-[8px]"
                          style={{ backgroundColor: preset.primary }}
                        >
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Manual Color Pickers Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
              {/* Primary Color Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cor Principal</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.customPrimary}
                    onChange={(e) => onUpdateSettings({ customPrimary: e.target.value, selectedThemeId: 'custom' })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-150 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={settings.customPrimary}
                    onChange={(e) => onUpdateSettings({ customPrimary: e.target.value, selectedThemeId: 'custom' })}
                    className="flex-1 px-3 py-2 border border-slate-150 rounded-xl text-xs text-slate-700 font-mono outline-none uppercase"
                  />
                </div>
              </div>

              {/* Secondary Color Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cor Secundária</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.customSecondary}
                    onChange={(e) => onUpdateSettings({ customSecondary: e.target.value, selectedThemeId: 'custom' })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-150 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={settings.customSecondary}
                    onChange={(e) => onUpdateSettings({ customSecondary: e.target.value, selectedThemeId: 'custom' })}
                    className="flex-1 px-3 py-2 border border-slate-150 rounded-xl text-xs text-slate-700 font-mono outline-none uppercase"
                  />
                </div>
              </div>

              {/* Background Color Picker */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Cor de Fundo</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.customBackground}
                    onChange={(e) => onUpdateSettings({ customBackground: e.target.value, selectedThemeId: 'custom' })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-slate-150 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={settings.customBackground}
                    onChange={(e) => onUpdateSettings({ customBackground: e.target.value, selectedThemeId: 'custom' })}
                    className="flex-1 px-3 py-2 border border-slate-150 rounded-xl text-xs text-slate-700 font-mono outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Custom System Sidebar Brand Titles */}
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs space-y-4">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider border-b pb-2 flex items-center gap-1.5 font-sans">
              🏷️ Identidade do Painel Interno
            </h3>
            <p className="text-[10px] text-slate-400 font-sans mt-1">Altere os textos exibidos no topo do menu lateral administrativo do seu sistema.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sidebar Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Título Principal (Marca)</label>
                <input
                  type="text"
                  value={settings.sidebarTitle ?? ''}
                  onChange={(e) => onUpdateSettings({ sidebarTitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-350"
                  placeholder="Ex: Lumini"
                />
              </div>

              {/* Sidebar Subtitle */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Subtítulo (Especialidade)</label>
                <input
                  type="text"
                  value={settings.sidebarSubtitle ?? ''}
                  onChange={(e) => onUpdateSettings({ sidebarSubtitle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-150 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-slate-350"
                  placeholder="Ex: Estética Avançada"
                />
              </div>
            </div>
          </div>

          {/* Visual Action Save Block */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white rounded-3xl border border-slate-100 shadow-xs gap-4">
            <div className="text-left">
              <p className="text-xs font-bold text-slate-800 font-sans">Pronto para publicar?</p>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5">Confirme as alterações visuais e de textos para que elas sejam aplicadas imediatamente.</p>
            </div>
            <button
              type="button"
              id="btn-save-all-settings"
              onClick={() => {
                if (onSaveSettings) {
                  onSaveSettings(settings);
                }
                setSavedSuccess(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setSavedSuccess(false), 5000);
              }}
              className="px-5 py-2.5 text-white text-xs font-bold font-sans rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md hover:bg-opacity-90 active:scale-98 transition-all"
              style={{ backgroundColor: customPrimary }}
            >
              <Check size={14} />
              Confirmar e Salvar Alterações
            </button>
          </div>
        </div>

        {/* Brand visual preview phone column */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[280px] bg-slate-900 rounded-[42px] p-3.5 shadow-2xl border-4 border-slate-800 relative">
            {/* Top speaker notch in phone template */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-10 flex items-center justify-center">
              <span className="w-10 h-1 bg-slate-800 rounded-full" />
            </div>

            {/* Simulated browser dashboard content frame layout inside smartphone */}
            <div 
              className="rounded-[32px] overflow-hidden min-h-[440px] flex flex-col justify-between text-slate-700 relative pt-7 pb-4 px-4 transition-all no-scrollbar overflow-y-auto"
              style={{ backgroundColor: customBackground }}
            >
              <div className="space-y-4">
                {/* Clinic Headline */}
                <div className="text-center pt-2">
                  <span 
                    className="w-12 h-12 rounded-full text-white text-md font-bold flex items-center justify-center mx-auto uppercase shadow-sm"
                    style={{ backgroundColor: customPrimary }}
                  >
                    {settings.name.charAt(0) || 'S'}
                  </span>
                  <h4 className="text-xs font-black text-slate-800 mt-2 capitalize">{settings.name || 'Samia'}</h4>
                  <p className="text-[8px] text-slate-400 mt-0.5 line-clamp-1">{settings.description || 'Clínica de Estética'}</p>
                </div>

                {/* Simulated booking flows */}
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs space-y-3 text-[10px]">
                  <p className="font-bold text-slate-700 border-b pb-1">📅 Escolha o Tratamento</p>
                  
                  {activeServices.length === 0 ? (
                    <p className="text-[8px] text-slate-400 italic">Nenhum serviço disponível.</p>
                  ) : (
                    <div className="space-y-1.5 Max-h-24 overflow-y-auto pr-0.5 no-scrollbar">
                      {activeServices.map((s, i) => (
                        <div key={s.id} className={`p-1.5 rounded-lg border text-left flex items-center justify-between ${
                          i === 0 ? 'border-indigo-400 bg-indigo-50/20' : 'border-slate-100'
                        }`}>
                          <div>
                            <p className="font-semibold text-slate-700 capitalize text-[8px]">{s.name}</p>
                            <p className="text-[7px] text-slate-400">{s.duration} min</p>
                          </div>
                          <span className="font-mono text-slate-700 font-bold text-[8px]">R$ {s.price.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scrollable Day selector */}
                <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1">
                  {['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'].map(d => {
                    const isSelected = selectedDay === d;
                    const hours = operatingHours.find(h => h.day === d);
                    const isClosed = !hours || !hours.enabled;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSelectedDay(d)}
                        className={`px-2 py-1 text-[8px] rounded-full shrink-0 font-medium transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-slate-800 text-white font-bold' 
                            : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-100'
                        }`}
                      >
                        {d.replace('-feira', '')} {isClosed && ' (fechado)'}
                      </button>
                    )
                  })}
                </div>

                {/* Calendar grid summary preview */}
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs space-y-2 text-[10px]">
                  <p className="font-bold text-slate-700 border-b pb-1">⏰ Horários para {selectedDay.replace('-feira', '')}</p>
                  
                  {(() => {
                    const hours = operatingHours.find(h => h.day === selectedDay);
                    if (!hours || !hours.enabled) {
                      return <p className="text-[8px] text-rose-500 italic font-medium">Clínica fechada hoje.</p>;
                    }
                    const slots: string[] = [];
                    const startH = parseInt(hours.start.split(':')[0]);
                    const endH = parseInt(hours.end.split(':')[0]);
                    for (let h = startH; h < endH; h++) {
                      slots.push(`${String(h).padStart(2, '0')}:00`);
                    }
                    if (slots.length === 0) {
                      return <p className="text-[8px] text-slate-400 italic">Sem horários hoje.</p>;
                    }
                    return (
                      <div className="grid grid-cols-3 gap-1 max-h-[70px] overflow-y-auto pr-0.5 no-scrollbar">
                        {slots.map((s, idx) => (
                          <span 
                            key={s} 
                            style={{ borderColor: idx === 0 ? customPrimary : '' }}
                            className={`py-1 text-center font-bold border rounded-lg text-[7px] font-mono leading-none flex items-center justify-center ${
                              idx === 0 
                                ? 'bg-indigo-50/50 text-indigo-700' 
                                : 'bg-slate-50 text-slate-500 border-slate-100'
                            }`}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Confirm bookings simulated click */}
              <div className="mt-4">
                <button 
                  disabled
                  className="w-full py-2 rounded-full text-[9px] font-bold text-white uppercase tracking-wider text-center"
                  style={{ backgroundColor: customPrimary }}
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 mt-2 font-medium flex items-center gap-1">
            <Smartphone size={11} /> Visualização da Tela do Cliente
          </span>
        </div>
      </div>
    </div>
  </div>
  );
}
