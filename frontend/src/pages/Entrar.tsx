import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  FileText, 
  Brain, 
  ShieldCheck, 
  Sparkles, 
  ChevronLeft 
} from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { useDadosStore } from '../store/useDadosStore';
import { AlternarTema } from '../components/AlternarTema';

export function Login() {
  const navigate = useNavigate();
  const { entrar } = useAutenticacaoStore();
  const { repositorios } = useDadosStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simula a autenticação na store local para passar pela rota de guarda
    entrar({
      id: '1',
      nome: 'João Silva',
      email: email || 'joao@empresa.com',
      funcao: 'admin',
      gruposAcesso: ['admin', 'rh', 'ti', 'geral']
    });
    // Redireciona baseado em repositórios: se tiver repositórios, vai para busca; caso contrário, vai para repositórios
    const destino = repositorios.length > 0 ? '/busca' : '/repositorios';
    navigate(destino);
  };

  const handleSSO = () => {
    // Simula a autenticação SSO para passar pela rota de guarda
    entrar({
      id: '1',
      nome: 'João Silva',
      email: 'joao@empresa.com',
      funcao: 'admin',
      gruposAcesso: ['admin', 'rh', 'ti', 'geral']
    });
    // Redireciona baseado em repositórios: se tiver repositórios, vai para busca; caso contrário, vai para repositórios
    const destino = repositorios.length > 0 ? '/busca' : '/repositorios';
    navigate(destino);
  };

  return (
    <div className="relative min-h-screen grid lg:grid-cols-12 bg-fluid-bg-light dark:bg-fluid-bg-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans overflow-hidden">
      
      {/* Botão de voltar e alternador de tema flutuantes */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-3">
        <Link 
          to="/" 
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-fluid-blue dark:text-slate-400 dark:hover:text-fluid-blue transition-colors px-3 py-1.5 rounded-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50"
        >
          <ChevronLeft className="w-4 h-4" />
          Início
        </Link>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-lg p-0.5">
          <AlternarTema />
        </div>
      </div>

      {/* PAINEL ESQUERDO: Ilustração & Branding Premium (Lg+) */}
      <div className="hidden lg:flex lg:col-span-5 relative flex-col justify-between p-12 bg-gradient-to-br from-fluid-blue to-fluid-deep text-white overflow-hidden">
        {/* Efeito de ondas fluídas no background */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          <svg width="100%" height="100%" className="absolute inset-0">
            <path d="M-100,100 C150,200 350,0 500,150 C650,300 850,100 1000,250 L1000,1000 L-100,1000 Z" fill="rgba(255,255,255,0.2)" />
            <path d="M-50,150 C200,300 300,50 450,200 C600,350 750,150 900,300 L900,1000 L-50,1000 Z" fill="rgba(255,255,255,0.1)" />
          </svg>
        </div>

        {/* Partículas brilhantes decorativas */}
        <div className="absolute top-1/4 left-1/3 w-32 h-32 rounded-full bg-fluid-success/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 rounded-full bg-white/10 blur-3xl" />

        {/* Header do painel */}
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-md">
              <FileText className="w-5 h-5 text-fluid-blue" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-xl tracking-tight">
              Flu<span className="text-blue-100">i</span>docs
            </span>
          </Link>
        </div>

        {/* Conteúdo Central */}
        <div className="relative z-10 my-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              Portal Corporativo
            </span>
            <h2 className="text-3xl xl:text-4xl font-extrabold leading-tight">
              Conecte-se ao conhecimento de sua empresa.
            </h2>
            <p className="text-blue-100/80 leading-relaxed text-sm xl:text-base">
              Acesse repositórios inteligentes com busca rápida e um assistente que responde com base nos seus documentos.
            </p>
          </motion.div>

          {/* Cards ilustrativos flutuantes */}
          <div className="space-y-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Assistente com Fontes Confiáveis</p>
                <p className="text-xs text-blue-100/70">Síntese com citações precisas</p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-white/10 backdrop-blur-md border border-white/15 p-4 rounded-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold">Segurança e Acessos Ativos</p>
                <p className="text-xs text-blue-100/70">Acesso controlado por grupos</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer do painel */}
        <div className="relative z-10 text-xs text-blue-100/60">
          © {new Date().getFullYear()} Fluidocs. FHO – Sistemas de Informação.
        </div>
      </div>

      {/* PAINEL DIREITO: Formulário de Login */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-center px-6 sm:px-16 lg:px-24 xl:px-32 py-12 relative">
        
        {/* Glow ambient background para mobile/tablet */}
        <div className="absolute top-[10%] left-[10%] w-[50%] h-[50%] rounded-full bg-fluid-blue/5 dark:bg-fluid-blue/3 blur-[120px] lg:hidden pointer-events-none" />

        <div className="max-w-md w-full mx-auto space-y-8 relative z-10">
          
          {/* Logo visível apenas no mobile */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-fluid-blue to-fluid-deep flex items-center justify-center shadow-md">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Fluidocs</span>
          </div>

          {/* Cabeçalho do formulário */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Bem-vindo de volta
            </h1>
            <p className="mt-2.5 text-sm text-slate-500 dark:text-slate-400">
              Acesse seu painel e repositórios inteligentes.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input de Email */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                E-mail Corporativo
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4.5 w-4.5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@empresa.com"
                  className="block w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all text-[15px]"
                />
              </div>
            </div>

            {/* Input de Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  Senha
                </label>
                <a href="#" className="text-xs font-semibold text-fluid-blue hover:text-fluid-deep transition-colors">
                  Esqueceu a senha?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4.5 w-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-11 py-3 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-fluid-blue focus:ring-fluid-blue"
              />
              <label htmlFor="remember-me" className="ml-2 text-sm text-slate-600 dark:text-slate-400 select-none">
                Lembrar-me neste dispositivo
              </label>
            </div>

            {/* Botão de Login Primário */}
            <button
              type="submit"
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold bg-gradient-to-r from-fluid-blue to-fluid-deep hover:shadow-lg hover:shadow-fluid-blue/20 transition-all duration-300 active:scale-[0.99] mt-2 cursor-pointer"
            >
              Acessar Plataforma
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 bg-fluid-bg-light dark:bg-fluid-bg-dark text-slate-400 font-semibold tracking-wider">
                Ou acesse com
              </span>
            </div>
          </div>

          {/* Login SSO (Google) */}
          <button
            type="button"
            onClick={handleSSO}
            className="w-full flex justify-center items-center gap-2.5 py-3 px-4 border border-slate-200 dark:border-slate-700/80 rounded-xl bg-white dark:bg-slate-800 text-[15px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all active:scale-[0.99] cursor-pointer"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google Workspace
          </button>

          {/* Links adicionais */}
          <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-8">
            Sua organização é nova por aqui?{' '}
            <Link to="/cadastrar" className="font-semibold text-fluid-blue hover:text-fluid-deep transition-colors">
              Crie uma conta corporativa
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
}
