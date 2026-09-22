import React from 'react';
import { useTemaStore } from '../store/useTemaStore';
import { Sun, Moon, Bell, Menu, Compass } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

interface PropsBarraNavegacao {
  aoClicarMenu: () => void;
}

export function BarraNavegacao({ aoClicarMenu }: PropsBarraNavegacao) {
  const { tema, alternarTema } = useTemaStore();
  const localizacao = useLocation();

  // Simple breadcrumbs builder
  const obterTituloRota = (caminho: string) => {
    switch (caminho) {
      case '/busca': return 'Busca e conversas';
      case '/assistente': return 'Busca e conversas';
      case '/repositorios': return 'Gerenciamento';
      case '/equipe': return 'Equipe & Controle de Acessos';
      default: return 'Painel Fluidocs';
    }
  };

  return (
    <header className="h-[80px] min-h-[80px] shrink-0 bg-white/70 dark:bg-[#1F2937]/75 backdrop-blur-md border-b border-slate-200/40 dark:border-slate-800/40 flex items-center justify-between px-6 transition-all duration-300 z-20">
      
      {/* Mobile toggler & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={aoClicarMenu}
          className="p-2.5 mr-1 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-all md:hidden active:scale-95 cursor-pointer"
          aria-label="Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:flex items-center gap-2.5 text-sm font-semibold text-slate-650 dark:text-slate-350">
          <Compass className="w-4.5 h-4.5 text-fluid-blue" />
          <span className="opacity-60">Fluidocs</span>
          <span className="text-slate-400">/</span>
          <motion.span 
            key={localizacao.pathname}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-slate-900 dark:text-white font-extrabold"
          >
            {obterTituloRota(localizacao.pathname)}
          </motion.span>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center space-x-3">
        
        {/* Theme Switcher */}
        <button
          onClick={alternarTema}
          className="p-2.5 rounded-xl text-slate-500 hover:text-fluid-blue hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer"
          aria-label="Alternar tema"
        >
          <motion.div
            key={tema}
            initial={{ rotate: -90, scale: 0.8 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {tema === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </motion.div>
        </button>

        {/* Notification Bell */}
        {/* ESCONDIDO POIS NAO ESTA SENDO UTILIZADO NO MOMENTO
        <button className="p-2.5 rounded-xl text-slate-500 hover:text-fluid-blue hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all duration-200 relative cursor-pointer">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-fluid-success rounded-full ring-2 ring-white dark:ring-[#1F2937]"></span>
        </button>
        */}
      </div>
    </header>
  );
}
