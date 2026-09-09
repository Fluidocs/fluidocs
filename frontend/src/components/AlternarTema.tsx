import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTemaStore } from '../store/useTemaStore';
import { motion } from 'motion/react';

export function AlternarTema() {
  const { tema, alternarTema } = useTemaStore();

  return (
    <button
      onClick={alternarTema}
      className="p-2.5 rounded-xl text-slate-500 hover:text-fluid-blue hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-all duration-200 cursor-pointer active:scale-95"
      aria-label="Alternar tema"
    >
      <motion.div
        key={tema}
        initial={{ rotate: -180, scale: 0.6, opacity: 0 }}
        animate={{ rotate: 0, scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        {tema === 'light' ? (
          <Moon className="w-5 h-5" />
        ) : (
          <Sun className="w-5 h-5" />
        )}
      </motion.div>
    </button>
  );
}
