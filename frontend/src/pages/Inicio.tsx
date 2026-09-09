import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Database, ShieldCheck, ArrowRight, FileText,
  MessageSquare, Zap, Upload, Brain, Layers, ChevronRight,
  Sparkles, Globe, Lock, BarChart3, Clock, Users
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { AlternarTema } from '../components/AlternarTema';

/* ───────────────────── Animated Counter Hook ───────────────────── */
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, hasStarted]);

  return { count, startCounter: () => setHasStarted(true) };
}

/* ───────────────────── Floating Particle ───────────────────── */
function FloatingParticle({ delay, size, x, y }: { delay: number; size: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute rounded-full bg-fluid-blue/10 dark:bg-fluid-blue/5"
      style={{ width: size, height: size, left: x, top: y }}
      animate={{
        y: [0, -30, 0],
        x: [0, 15, 0],
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 6 + delay,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    />
  );
}

/* ───────────────────── Feature Card ───────────────────── */
interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}

function FeatureCard({ icon, title, description, gradient, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative bg-white dark:bg-slate-800/80 backdrop-blur-sm p-8 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm hover:shadow-xl hover:shadow-fluid-blue/5 dark:hover:shadow-fluid-blue/10 transition-shadow duration-500"
    >
      {/* Gradient accent on hover */}
      <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient} -z-10 blur-xl scale-95`} />

      <div className="w-14 h-14 rounded-2xl bg-fluid-light dark:bg-fluid-blue/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[15px]">{description}</p>
    </motion.div>
  );
}

/* ───────────────────── Workflow Step ───────────────────── */
interface WorkflowStepProps {
  step: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function WorkflowStep({ step, icon, title, description, delay }: WorkflowStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex items-start gap-5 group"
    >
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-fluid-blue to-fluid-deep flex items-center justify-center shadow-lg shadow-fluid-blue/25 group-hover:shadow-fluid-blue/40 transition-shadow duration-300">
          {icon}
        </div>
        <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-fluid-success text-white text-xs font-bold flex items-center justify-center shadow-sm">
          {step}
        </span>
      </div>
      <div>
        <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h4>
        <p className="text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

/* ───────────────────── Stat Card ───────────────────── */
function StatCard({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) {
  const { count, startCounter } = useCounter(value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      onViewportEnter={startCounter}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-fluid-blue to-fluid-deep">
        {count}{suffix}
      </span>
      <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm font-medium">{label}</p>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT – Inicio (Landing Page)
   ═══════════════════════════════════════════════════════ */
export function Inicio() {
  const { scrollYProgress } = useScroll();
  const headerBg = useTransform(
    scrollYProgress,
    [0, 0.05],
    ['rgba(255,255,255,0)', 'rgba(255,255,255,0.85)']
  );

  return (
    <div className="min-h-screen bg-fluid-bg-light dark:bg-fluid-bg-dark text-slate-900 dark:text-slate-100 transition-colors duration-300 overflow-x-hidden">

      {/* ────────── Ambient Background ────────── */}
      <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
        {/* Primary radial gradients */}
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-fluid-blue/8 dark:bg-fluid-blue/4 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-fluid-success/6 dark:bg-fluid-success/3 blur-[140px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-fluid-deep/5 dark:bg-fluid-deep/3 blur-[120px]" />

        {/* Floating particles */}
        <FloatingParticle delay={0} size={8} x="10%" y="20%" />
        <FloatingParticle delay={1.5} size={6} x="80%" y="15%" />
        <FloatingParticle delay={0.8} size={10} x="60%" y="60%" />
        <FloatingParticle delay={2.2} size={7} x="25%" y="70%" />
        <FloatingParticle delay={1} size={5} x="90%" y="45%" />
        <FloatingParticle delay={3} size={9} x="45%" y="35%" />
        <FloatingParticle delay={0.5} size={6} x="70%" y="80%" />
      </div>

      {/* ────────── Sticky Header / Navbar ────────── */}
      <motion.header
        style={{ backgroundColor: headerBg }}
        className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-transparent dark:bg-fluid-bg-dark/80"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Fluidocs - Página inicial">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fluid-blue to-fluid-deep flex items-center justify-center shadow-md shadow-fluid-blue/20 group-hover:shadow-fluid-blue/40 transition-shadow duration-300">
              <FileText className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
              Flu<span className="text-fluid-blue">i</span>docs
            </span>
          </Link>

          {/* Nav links + CTA */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Menu principal">
            <a href="#recursos" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-fluid-blue dark:hover:text-fluid-blue transition-colors">
              Recursos
            </a>
            <a href="#como-funciona" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-fluid-blue dark:hover:text-fluid-blue transition-colors">
              Como Funciona
            </a>
            <a href="#numeros" className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-fluid-blue dark:hover:text-fluid-blue transition-colors">
              Números
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <AlternarTema />
            <Link
              to="/entrar"
              className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-fluid-blue dark:hover:text-fluid-blue transition-colors px-4 py-2"
            >
              Entrar
            </Link>
            <Link
              to="/cadastrar"
              className="text-sm font-semibold bg-gradient-to-r from-fluid-blue to-fluid-deep text-white px-5 py-2.5 rounded-xl hover:shadow-lg hover:shadow-fluid-blue/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              Criar Conta
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ────────── Hero Section ────────── */}
      <section className="relative pt-36 pb-24 md:pt-44 md:pb-32">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-5xl mx-auto">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-fluid-blue/10 dark:bg-fluid-blue/15 text-fluid-blue dark:text-fluid-light text-sm font-medium border border-fluid-blue/20 dark:border-fluid-blue/30">
                <Sparkles className="w-4 h-4" />
                Inteligência Artificial + Busca Inteligente
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mt-8 text-5xl md:text-7xl lg:text-[80px] font-extrabold tracking-tight leading-[1.08]"
            >
              Seus documentos,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fluid-blue via-fluid-deep to-fluid-success">
                uma conversa.
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-7 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
            >
              Pare de escavar pastas e PDFs. O Fluidocs organiza seus repositórios e permite que você
              <strong className="text-slate-800 dark:text-slate-200"> pergunte</strong>,{' '}
              <strong className="text-slate-800 dark:text-slate-200">busque</strong> e{' '}
              <strong className="text-slate-800 dark:text-slate-200">descubra</strong> informações com IA avançada — em milissegundos.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-4"
            >
              <Link
                to="/cadastrar"
                id="hero-cta-signup"
                className="group w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-fluid-blue to-fluid-deep text-white px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-fluid-blue/20 hover:shadow-2xl hover:shadow-fluid-blue/30 transition-all duration-300 hover:-translate-y-1"
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Link>
              <Link
                to="/entrar"
                id="hero-cta-login"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-700 dark:text-slate-200 px-8 py-4 rounded-2xl font-semibold text-lg border border-slate-200 dark:border-slate-700 hover:border-fluid-blue/40 dark:hover:border-fluid-blue/40 transition-all duration-300 hover:-translate-y-1"
              >
                Acessar Minha Conta
              </Link>
            </motion.div>
          </div>

          {/* ────── Dashboard Preview ────── */}
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-20 relative mx-auto max-w-5xl"
          >
            {/* Glow behind the card */}
            <div className="absolute inset-0 bg-gradient-to-r from-fluid-blue/20 via-transparent to-fluid-success/20 blur-3xl scale-95 -z-10" />

            <div className="relative rounded-3xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-md shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-slate-200/80 dark:border-slate-700/60 overflow-hidden">
              {/* Window chrome */}
              <div className="h-12 border-b border-slate-200 dark:border-slate-700 flex items-center px-5 gap-2.5 bg-slate-50/80 dark:bg-slate-900/50">
                <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#28C840]" />
                <div className="ml-4 flex-1 max-w-xs h-7 rounded-lg bg-slate-100 dark:bg-slate-700/80 flex items-center px-3">
                  <Globe className="w-3.5 h-3.5 text-slate-400 mr-2" />
                  <span className="text-xs text-slate-400 font-mono">app.fluidocs.com.br</span>
                </div>
              </div>

              {/* Fake app content */}
              <div className="p-6 md:p-8 flex gap-6 min-h-[420px]">
                {/* Sidebar mock */}
                <div className="w-52 hidden lg:flex flex-col gap-2 border-r border-slate-100 dark:border-slate-700/50 pr-6">
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-fluid-blue/10 text-fluid-blue text-sm font-medium">
                    <MessageSquare className="w-4 h-4" /> Assistente IA
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <Search className="w-4 h-4" /> Busca
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <Database className="w-4 h-4" /> Repositórios
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-slate-500 dark:text-slate-400 text-sm hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <Users className="w-4 h-4" /> Equipe
                  </div>

                  {/* Mini repo cards */}
                  <div className="mt-auto space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold px-1">Repositórios</p>
                    <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-fluid-success" /> Contratos 2026
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-700/40 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-fluid-blue" /> RH Documentos
                    </div>
                  </div>
                </div>

                {/* Chat mock */}
                <div className="flex-1 flex flex-col gap-5">
                  {/* User message */}
                  <div className="flex gap-3 items-start">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
                      <Users className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-700/80 p-4 rounded-2xl rounded-tl-md max-w-md">
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Quais contratos vencem nos próximos 30 dias?
                      </p>
                    </div>
                  </div>

                  {/* AI response */}
                  <div className="flex gap-3 items-start flex-row-reverse">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-fluid-blue to-fluid-deep flex-shrink-0 flex items-center justify-center shadow-md shadow-fluid-blue/20">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-fluid-light/80 dark:bg-fluid-blue/10 border border-fluid-blue/15 dark:border-fluid-blue/20 p-4 rounded-2xl rounded-tr-md max-w-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                        Encontrei <strong>3 contratos</strong> com vencimento nos próximos 30 dias no repositório "Contratos 2026":
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                        <li className="flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-fluid-blue" />
                          Contrato_Fornecedor_ABC.pdf — 12/06/2026
                        </li>
                        <li className="flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-fluid-blue" />
                          SLA_Infraestrutura.docx — 18/06/2026
                        </li>
                        <li className="flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-fluid-blue" />
                          Acordo_Parceria_XYZ.pdf — 25/06/2026
                        </li>
                      </ul>

                      {/* Cited source attachment */}
                      <div className="mt-3 flex items-center gap-2 bg-white/80 dark:bg-slate-800/60 p-2.5 rounded-xl border border-fluid-blue/10 dark:border-fluid-blue/15">
                        <FileText className="w-4 h-4 text-red-500 flex-shrink-0" />
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate">Contrato_Fornecedor_ABC.pdf</span>
                        <span className="ml-auto text-[10px] text-fluid-blue font-medium">p.3</span>
                      </div>
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="mt-auto flex items-center gap-2 px-4">
                    <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-fluid-blue" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 rounded-full bg-fluid-blue" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 rounded-full bg-fluid-blue" />
                    </div>
                    <span className="text-xs text-slate-400">Fluidocs está digitando...</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
              className="absolute -right-6 top-24 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/60 hidden xl:flex items-center gap-3"
            >
              <div className="p-2.5 bg-fluid-success/10 rounded-xl">
                <Zap className="w-5 h-5 text-fluid-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">~46ms</p>
                <p className="text-[11px] text-slate-500">Resposta rápida</p>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1.2 }}
              className="absolute -left-6 bottom-24 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-700/60 hidden xl:flex items-center gap-3"
            >
              <div className="p-2.5 bg-fluid-blue/10 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-fluid-blue" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Acesso seguro</p>
                <p className="text-[11px] text-slate-500">Segurança fim-a-fim</p>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* SVG Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path
              d="M0 60L48 55C96 50 192 40 288 45C384 50 480 70 576 75C672 80 768 70 864 60C960 50 1056 40 1152 45C1248 50 1344 70 1392 80L1440 90V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V60Z"
              className="fill-white dark:fill-slate-800/50"
            />
          </svg>
        </div>
      </section>

      {/* ────────── Features Section ────────── */}
      <section id="recursos" className="py-24 md:py-32 bg-white dark:bg-slate-800/50 relative">
        <div className="container mx-auto px-6">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-2xl mx-auto mb-16"
          >
            <span className="text-fluid-blue font-semibold text-sm uppercase tracking-wider">Recursos</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
              Tudo o que sua equipe precisa para{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fluid-blue to-fluid-deep">
                dominar seus documentos
              </span>
            </h2>
          </motion.div>

          {/* Feature cards grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <FeatureCard
              icon={<Search className="w-6 h-6 text-fluid-blue" />}
              title="Busca Inteligente"
              description="Encontre documentos pelo significado da pergunta, não apenas por palavras-chave exatas."
              gradient="bg-gradient-to-br from-fluid-blue/5 to-transparent"
              delay={0.1}
            />
            <FeatureCard
              icon={<Brain className="w-6 h-6 text-fluid-blue" />}
              title="Assistente com Fontes"
              description="Converse naturalmente com seus documentos. Obtenha respostas precisas com citações rastreáveis direto das fontes originais."
              gradient="bg-gradient-to-br from-fluid-deep/5 to-transparent"
              delay={0.2}
            />
            <FeatureCard
              icon={<ShieldCheck className="w-6 h-6 text-fluid-blue" />}
              title="Controle de Acesso"
              description="Permissões granulares por grupos. Cada colaborador vê apenas os documentos que tem autorização para acessar."
              gradient="bg-gradient-to-br from-fluid-success/5 to-transparent"
              delay={0.3}
            />
            <FeatureCard
              icon={<Layers className="w-6 h-6 text-fluid-blue" />}
              title="Repositórios Organizados"
              description="Estruture seus documentos em repositórios temáticos com upload inteligente e prevenção de arquivos duplicados."
              gradient="bg-gradient-to-br from-fluid-blue/5 to-transparent"
              delay={0.4}
            />
            <FeatureCard
              icon={<Lock className="w-6 h-6 text-fluid-blue" />}
              title="Segurança Corporativa"
              description="Proteções de sessão, conteúdo seguro e verificação de integridade para preservar seus documentos."
              gradient="bg-gradient-to-br from-fluid-deep/5 to-transparent"
              delay={0.5}
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6 text-fluid-blue" />}
              title="Respostas Rápidas"
              description="Resultados carregam de forma fluida, mesmo em bases grandes e pesquisas mais complexas."
              gradient="bg-gradient-to-br from-fluid-success/5 to-transparent"
              delay={0.6}
            />
          </div>
        </div>
      </section>

      {/* ────────── How It Works Section ────────── */}
      <section id="como-funciona" className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Left - Text */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <span className="text-fluid-blue font-semibold text-sm uppercase tracking-wider">Como Funciona</span>
                <h2 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white leading-tight">
                  Da ingestão à resposta em{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-fluid-blue to-fluid-success">
                    quatro etapas
                  </span>
                </h2>
                <p className="mt-4 text-slate-600 dark:text-slate-400 leading-relaxed">
                  O Fluidocs transforma qualquer base documental em conhecimento acessível e pesquisável.
                </p>
              </motion.div>

              <div className="mt-10 space-y-8">
                <WorkflowStep
                  step={1}
                  icon={<Upload className="w-6 h-6 text-white" />}
                  title="Envio de Documentos"
                  description="Faça upload de PDFs, DOCX ou imagens. O Fluidocs prepara o conteúdo para consulta com rapidez."
                  delay={0.1}
                />
                <WorkflowStep
                  step={2}
                  icon={<Database className="w-6 h-6 text-white" />}
                  title="Organização Inteligente"
                  description="Cada documento é preparado e organizado para aparecer nas pesquisas com contexto relevante."
                  delay={0.2}
                />
                <WorkflowStep
                  step={3}
                  icon={<Search className="w-6 h-6 text-white" />}
                  title="Busca com Contexto"
                  description="As consultas encontram informações relevantes mesmo quando o texto não usa exatamente as mesmas palavras."
                  delay={0.3}
                />
                <WorkflowStep
                  step={4}
                  icon={<Brain className="w-6 h-6 text-white" />}
                  title="Geração com IA"
                  description="A IA gera respostas fundamentadas com citações diretas dos seus documentos originais."
                  delay={0.4}
                />
              </div>
            </div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="hidden lg:block relative"
            >
              <div className="relative">
                {/* Architecture diagram card */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-3xl p-8 border border-slate-200/80 dark:border-slate-700/60 shadow-xl">
                  <div className="text-center mb-8">
                    <p className="text-sm font-semibold text-fluid-blue uppercase tracking-wider">Fluxo Fluidocs</p>
                  </div>

                  {/* Flow nodes */}
                  <div className="space-y-4">
                    {/* Node: Documents */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-red-500" />
                      </div>
                      <div className="flex-1 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">PDF • DOCX • Imagens</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-8 h-8 rounded-full bg-fluid-blue/10 flex items-center justify-center"
                      >
                        <ArrowRight className="w-4 h-4 text-fluid-blue rotate-90" />
                      </motion.div>
                    </div>

                    {/* Node: Processing */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-5 h-5 text-amber-500" />
                      </div>
                      <div className="flex-1 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Leitura e preparação</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                        className="w-8 h-8 rounded-full bg-fluid-blue/10 flex items-center justify-center"
                      >
                        <ArrowRight className="w-4 h-4 text-fluid-blue rotate-90" />
                      </motion.div>
                    </div>

                    {/* Node: Search */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-fluid-light dark:bg-fluid-blue/20 flex items-center justify-center flex-shrink-0">
                        <Search className="w-5 h-5 text-fluid-blue" />
                      </div>
                      <div className="flex-1 h-12 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center px-4">
                        <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Busca inteligente</span>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex justify-center">
                      <motion.div
                        animate={{ y: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                        className="w-8 h-8 rounded-full bg-fluid-success/10 flex items-center justify-center"
                      >
                        <ArrowRight className="w-4 h-4 text-fluid-success rotate-90" />
                      </motion.div>
                    </div>

                    {/* Node: AI Response */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-fluid-blue to-fluid-deep flex items-center justify-center flex-shrink-0 shadow-md shadow-fluid-blue/25">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 h-12 rounded-xl bg-gradient-to-r from-fluid-blue/5 to-fluid-success/5 dark:from-fluid-blue/10 dark:to-fluid-success/10 border border-fluid-blue/10 dark:border-fluid-blue/20 flex items-center px-4">
                        <span className="text-sm text-fluid-deep dark:text-fluid-light font-semibold">Resposta com Citações ✓</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Decorative glow */}
                <div className="absolute -inset-4 bg-gradient-to-r from-fluid-blue/10 via-transparent to-fluid-success/10 blur-3xl -z-10 rounded-3xl" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ────────── Stats Section ────────── */}
      <section id="numeros" className="py-24 md:py-28 bg-white dark:bg-slate-800/50 relative overflow-hidden">
        {/* Subtle wave top */}
        <div className="absolute top-0 left-0 right-0 -translate-y-[1px]">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full rotate-180">
            <path
              d="M0 40L60 35C120 30 240 20 360 25C480 30 600 50 720 55C840 60 960 50 1080 40C1200 30 1320 20 1380 15L1440 10V80H0V40Z"
              className="fill-fluid-bg-light dark:fill-fluid-bg-dark"
            />
          </svg>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-fluid-blue font-semibold text-sm uppercase tracking-wider">Em Números</span>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">
              Velocidade que{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-fluid-blue to-fluid-success">
                faz a diferença
              </span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <StatCard value={46} label="ms de resposta média" suffix="ms" />
            <StatCard value={352} label="ms em consultas completas" suffix="ms" />
            <StatCard value={256} label="níveis de verificação" suffix="" />
            <StatCard value={99} label="de disponibilidade garantida" suffix="%" />
          </div>
        </div>
      </section>

      {/* ────────── CTA Section ────────── */}
      <section className="py-24 md:py-32 relative">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative max-w-4xl mx-auto text-center"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-fluid-blue/10 via-fluid-deep/5 to-fluid-success/10 blur-3xl -z-10 scale-110 rounded-full" />

            <div className="bg-gradient-to-br from-fluid-blue to-fluid-deep rounded-3xl p-12 md:p-16 shadow-2xl shadow-fluid-blue/20 relative overflow-hidden">
              {/* Pattern overlay */}
              <div className="absolute inset-0 opacity-10">
                <svg width="100%" height="100%">
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
                  </pattern>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight relative z-10">
                Pronto para transformar a gestão<br />
                de documentos da sua equipe?
              </h2>
              <p className="mt-5 text-blue-100/90 text-lg max-w-2xl mx-auto relative z-10">
                Comece a usar o Fluidocs gratuitamente e descubra como a busca inteligente com IA pode revolucionar seu fluxo de trabalho.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4 relative z-10">
                <Link
                  to="/cadastrar"
                  id="cta-bottom-signup"
                  className="group flex items-center justify-center gap-2 bg-white text-fluid-deep px-8 py-4 rounded-2xl font-semibold text-lg hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 shadow-lg"
                >
                  Criar Conta Grátis
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/entrar"
                  id="cta-bottom-login"
                  className="flex items-center justify-center gap-2 bg-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm"
                >
                  Já tenho uma conta
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────────── Footer ────────── */}
      <footer className="border-t border-slate-200 dark:border-slate-700/60 bg-white/50 dark:bg-slate-800/30 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fluid-blue to-fluid-deep flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg text-slate-900 dark:text-white">
                Flu<span className="text-fluid-blue">i</span>docs
              </span>
            </div>

            {/* Links */}
            <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400">
              <a href="#recursos" className="hover:text-fluid-blue transition-colors">Recursos</a>
              <a href="#como-funciona" className="hover:text-fluid-blue transition-colors">Como Funciona</a>
              <a href="#numeros" className="hover:text-fluid-blue transition-colors">Números</a>
            </div>

            {/* Copyright */}
            <p className="text-sm text-slate-400 dark:text-slate-500">
              © {new Date().getFullYear()} Fluidocs · FHO – Sistemas de Informação
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
