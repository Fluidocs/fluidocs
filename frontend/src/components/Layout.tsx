import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { useDadosStore } from '../store/useDadosStore';
import { api } from '../services/api';
import { BarraLateral } from './BarraLateral';
import { BarraNavegacao } from './BarraNavegacao';
import { motion, AnimatePresence } from 'motion/react';

export function Layout() {
  const { estaAutenticado } = useAutenticacaoStore();
  const { definirRepositorios } = useDadosStore();
  const [barraLateralAberta, setBarraLateralAberta] = useState(false);

  useLayoutEffect(() => {
    if (!estaAutenticado) return;

    const html = document.documentElement;
    const body = document.body;
    const estilosOriginais = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      scrollRestoration: window.history.scrollRestoration,
    };

    window.history.scrollRestoration = 'manual';
    html.scrollTop = 0;
    body.scrollTop = 0;
    window.scrollTo(0, 0);
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = estilosOriginais.htmlOverflow;
      body.style.overflow = estilosOriginais.bodyOverflow;
      window.history.scrollRestoration = estilosOriginais.scrollRestoration;
    };
  }, [estaAutenticado]);

  useEffect(() => {
    if (!estaAutenticado) return;

    let cancelado = false;

    api.listarRepositorios()
      .then((repositorios) => {
        if (cancelado) return;

        definirRepositorios(repositorios.map((repositorio) => ({
          id: repositorio.id,
          nome: repositorio.descricao,
          url: repositorio.url_repositorio_integracao,
          tipo: repositorio.tipo,
          gruposAcesso: repositorio.gruposAcesso,
        })));
      })
      .catch((erro) => {
        console.warn('Nao foi possivel carregar repositorios.', erro);
      });

    return () => {
      cancelado = true;
    };
  }, [definirRepositorios, estaAutenticado]);

  if (!estaAutenticado) {
    return <Navigate to="/entrar" replace />;
  }

  return (
    <div className="fixed inset-0 flex h-[100dvh] max-h-[100dvh] min-h-0 bg-fluid-bg-light dark:bg-fluid-bg-dark text-slate-800 dark:text-slate-100 transition-colors duration-300 overflow-hidden font-sans">
      
      {/* Decorative Fluid Waves in Background */}
      <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-20 z-0">
        <svg className="absolute w-[200%] h-[60%] -bottom-10 -left-1/4 text-fluid-light dark:text-slate-800/40 animate-[wave_20s_infinite_linear]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" fill="currentColor" />
        </svg>
        <svg className="absolute w-[200%] h-[50%] -bottom-5 -left-1/2 text-indigo-100/40 dark:text-slate-900/30 animate-[wave_15s_infinite_linear]" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 C120,80 240,20 360,50 C480,80 600,20 720,50 C840,80 960,20 1080,50 C1200,80 1320,20 1440,50 L1440,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Mobile sidebar backdrop with blur effect */}
      <AnimatePresence>
        {barraLateralAberta && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm md:hidden cursor-pointer"
            onClick={() => setBarraLateralAberta(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar with spring animation */}
      <div className="hidden md:block h-full shrink-0 z-30">
        <BarraLateral />
      </div>

      <AnimatePresence>
        {barraLateralAberta && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 z-50 md:hidden shadow-2xl"
          >
            <BarraLateral aoFechar={() => setBarraLateralAberta(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden w-full z-10 relative">
        <BarraNavegacao aoClicarMenu={() => setBarraLateralAberta(true)} />
        <main className="flex-1 min-h-0 overflow-x-hidden overflow-y-auto p-4 md:p-8">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="max-w-7xl mx-auto w-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
