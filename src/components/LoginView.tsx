import React, { useState } from 'react';
import { Sparkles, Shield, User, Lock, Phone, Layout, Key, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLogin: (role: 'admin' | 'clinic', tenantId?: string) => void;
  tenants: any[];
  onCreateTenant: (tenant: { name: string; email: string; password?: string; phone: string; plan: string }) => void;
}

export default function LoginView({ onLogin, tenants, onCreateTenant }: LoginViewProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPlan, setRegPlan] = useState('Grátis');
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // Check Superadmin Credentials
    if ((email.toLowerCase() === 'admin@leonel.com' || email.toLowerCase() === 'admin@lumini.com') && password === 'admin') {
      onLogin('admin');
      return;
    }

    // Check Tenants
    const found = tenants.find(t => t.email.toLowerCase() === email.toLowerCase() && t.password === password);
    if (found) {
      if (found.status === 'Suspenso') {
        setLoginError('Sua conta ou clínica foi suspensa pelo Administrador.');
        return;
      }
      onLogin('clinic', found.id);
    } else {
      setLoginError('Credenciais inválidas. Use "admin@leonel.com" para Superadmin.');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Check email uniqueness
    const exists = tenants.some(t => t.email.toLowerCase() === regEmail.toLowerCase());
    if (exists || regEmail.toLowerCase() === 'admin@leonel.com' || regEmail.toLowerCase() === 'admin@lumini.com') {
      alert('Este endereço de email já está em uso.');
      return;
    }

    const newTenant = {
      name: regName,
      email: regEmail,
      password: regPassword,
      phone: regPhone,
      plan: 'Grátis'
    };

    onCreateTenant(newTenant);
    setRegSuccess(true);
    setTimeout(() => {
      // Auto switch and log in
      const savedTenants = JSON.parse(localStorage.getItem('lumini_tenants') || '[]');
      const newlyCreated = savedTenants.find((t: any) => t.email === regEmail);
      if (newlyCreated) {
        onLogin('clinic', newlyCreated.id);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vh] h-[50vh] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-[32px] border border-slate-700/60 shadow-2xl p-8 relative z-10 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-white tracking-tight">LEONEL <span className="text-indigo-400">CRM</span></h2>
          <p className="text-slate-400 text-xs">Gestão Integrada para Clínicas de Estética Avançada</p>
        </div>

        {/* Tab switcher */}
        {!regSuccess && (
          <div className="grid grid-cols-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-700/50">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setLoginError(''); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setLoginError(''); }}
              className={`py-2 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Crie sua conta
            </button>
          </div>
        )}

        {regSuccess ? (
          <div className="py-8 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-500/15 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 size={32} className="animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Clínica Criada com Sucesso!</h3>
              <p className="text-xs text-slate-400">Iniciando base de dados isolada no MongoDB/Postgres local...</p>
            </div>
            <p className="text-[10px] text-indigo-400 animate-pulse font-mono font-bold">Redirecionando para o seu dashboard...</p>
          </div>
        ) : activeTab === 'login' ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4 animate-fade-in">
            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-[10px] font-medium leading-relaxed">
                ⚠️ {loginError}
              </div>
            )}

            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">E-mail Administrativo</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="exemplo@clinica.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Senha</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-indigo-500/20 flex items-center justify-center gap-1.5 cursor-pointer mt-2"
            >
              Acessar Painel <ArrowRight size={14} />
            </button>
          </form>
        ) : (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4 animate-fade-in">
            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 no-scrollbar pb-1">
              {/* Clinic Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Nome do Consultório / Clínica</label>
                <div className="relative">
                  <Layout size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clínica Bella Estética"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">E-mail do Proprietário</label>
                <div className="relative">
                  <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="contato@clinica.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">WhatsApp de Contato</label>
                <div className="relative">
                  <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="(48) 99999-9999"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Senha de Acesso</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg hover:shadow-emerald-500/20 flex items-center justify-center gap-1 cursor-pointer mt-2"
            >
              Registrar Clínica e Iniciar Plano Grátis <Sparkles size={11} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
