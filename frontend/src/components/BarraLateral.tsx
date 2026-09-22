import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Database, KeyRound, Users, LayoutGrid, LogOut, X, Search, MessageSquare, Sparkles } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { clsx } from 'clsx';
import { motion } from 'motion/react';

interface PropsBarraLateral {
  aoFechar?: () => void;
}

export function BarraLateral({ aoFechar }: PropsBarraLateral) {
  const { usuario, sair } = useAutenticacaoStore();
  const { pathname } = useLocation();
  const gerenciamento = pathname === '/repositorios' || pathname === '/equipe';

  const secoes = [
    {
      titulo: 'Busca e conversas',
      itens: [
        { para: '/busca', icone: Search, rotulo: 'Busca de documentos' },
        { para: '/assistente', icone: MessageSquare, rotulo: 'Conversas' },
      ]
    },
    {
      titulo: 'Gerenciamento',
      itens: [
        { para: '/fontes-de-dados', icone: Database, rotulo: 'Fontes de Dados' },
        { para: '/chaves-api', icone: KeyRound, rotulo: 'Chaves de API' }
        /*,
        ESCONDIDO POIS NAO ESTA SENDO UTILIZADO NO MOMENTO
        ...(usuario?.funcao === 'admin' ? [{ para: '/equipe', icone: Users, rotulo: 'Equipe e Acessos' }] : []),*/
      ]
    }
  ];

  return (
    <aside className="w-64 h-full bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col transition-all duration-300 shadow-xl shadow-slate-100/50 dark:shadow-none z-30">
      
      {/* Brand Header */}
      <div className="h-[80px] min-h-[80px] shrink-0 flex items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-fluid-blue to-fluid-deep text-white shadow-md shadow-fluid-blue/20">
            {/* Custom stylized document wave logo using simple SVG */}
            <svg className="w-5.5 h-5.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
              <path d="M8 13c1.5 1.5 2.5-1.5 4 0" />
              <path d="M8 17c1.5 1.5 2.5-1.5 4 0" />
            </svg>
            <motion.div 
              animate={{ opacity: [0.4, 0.9, 0.4] }} 
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 w-3 h-3 bg-fluid-success rounded-full border-2 border-white dark:border-[#1F2937]"
            />
          </div>
          <div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Fluidocs</span>
            <div className="flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-fluid-blue" />
              <span className="text-[9px] font-bold text-fluid-blue uppercase tracking-widest">Documentos Inteligentes</span>
            </div>
          </div>
        </div>
        
        {aoFechar && (
          <button 
            onClick={aoFechar}
            aria-label="Fechar menu"
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation sections */}
      <nav className="flex-1 overflow-y-auto py-6 px-4">
        <NavLink to="/hub" onClick={aoFechar} className="mb-6 flex min-h-11 items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-fluid-deep dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600">
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />Trocar módulo
        </NavLink>
        {secoes.filter((secao) => secao.titulo === (gerenciamento ? 'Gerenciamento' : 'Busca e conversas')).map((secao) => (
          <div key={secao.titulo} className="mb-6">
            <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-4 mb-2.5">
              {secao.titulo}
            </p>
            <ul className="space-y-1.5">
              {secao.itens.map((item) => (
                <li key={item.para} className="relative">
                  <NavLink
                    to={item.para}
                    onClick={aoFechar}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all relative overflow-hidden group cursor-pointer',
                        isActive
                          ? 'text-fluid-blue shadow-sm shadow-fluid-blue/5'
                          : 'text-slate-650 hover:text-slate-900 dark:text-slate-350 dark:hover:text-white'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active dynamic glass background animation */}
                        {isActive && (
                          <motion.span
                            layoutId="activeNav"
                            className="absolute inset-0 bg-gradient-to-r from-fluid-blue/10 to-fluid-blue/5 rounded-xl z-0"
                            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                          />
                        )}
                        
                        {/* Icon and label */}
                        <item.icone className="w-4.5 h-4.5 mr-3 relative z-10" />
                        <span className="relative z-10">{item.rotulo}</span>
                        
                        {/* Hover accent line */}
                        {isActive && (
                          <motion.span
                            layoutId="activeBorder"
                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-transparent via-fluid-blue to-transparent rounded-r-full"
                            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                          />
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Section Footer */}
      <div className="shrink-0 px-4 py-6 border-t border-slate-200/50 dark:border-slate-800/50">
        {/* 
          ESCONDIDO POIS NÃO ESTA SENDO UTILIZADO NO MOMENTO
        <div className="flex items-center gap-3 mb-4 px-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fluid-blue to-fluid-deep text-white flex items-center justify-center text-xs font-extrabold shadow-md">
            {usuario?.nome?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
              {usuario?.nome || 'Usuário'}
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {usuario?.email || 'email@exemplo.com'}
            </p>
          </div>
        </div> 
        */}

        <button
          onClick={sair}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sair do Sistema
        </button>
      </div>
    </aside>
  );
}
