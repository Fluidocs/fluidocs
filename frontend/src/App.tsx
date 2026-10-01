import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Inicio } from './pages/Inicio';
import { Login } from './pages/Entrar';
import { Cadastrar } from './pages/Cadastrar';
import { Busca } from './pages/Busca';
import { Conversas } from './pages/Conversas';
import { LayoutConsumo } from './components/LayoutConsumo';
import { FontesDados } from './pages/FontesDados';
import { ChavesApi } from './pages/ChavesApi';
import { LayoutGerenciamento } from './components/LayoutGerenciamento';
import { Equipe } from './pages/Equipe';
import { Hub } from './pages/Hub';
import { useAutenticacaoStore } from './store/useAutenticacaoStore';
import { api } from './services/api';

export default function App() {
  const { tokenAcesso, usuario, entrar, sair } = useAutenticacaoStore();

  useEffect(() => {
    if (!tokenAcesso || usuario) return;
    let cancelado = false;
    api.obterUsuarioAtual(tokenAcesso)
      .then((conta) => {
        if (!cancelado && useAutenticacaoStore.getState().tokenAcesso === tokenAcesso) {
          entrar(conta, tokenAcesso);
        }
      })
      .catch(() => {
        if (!cancelado && useAutenticacaoStore.getState().tokenAcesso === tokenAcesso) sair();
      });
    return () => { cancelado = true; };
  }, [tokenAcesso, usuario, entrar, sair]);

  if (tokenAcesso && !usuario) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100" role="status">Verificando sua sessão…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastrar" element={<Cadastrar />} />
        <Route path="/hub" element={<Hub />} />

        <Route element={<LayoutGerenciamento />}>
          <Route path="/fontes-de-dados" element={<FontesDados />} />
          <Route path="/chaves-api" element={<ChavesApi />} />
          <Route path="/repositorios" element={<Navigate to="/fontes-de-dados" replace />} />
        </Route>
        
        <Route element={<LayoutConsumo />}>
          <Route path="/busca" element={<Busca />} />
          <Route path="/conversas" element={<Conversas />} />
          <Route path="/assistente" element={<Navigate to="/conversas" replace />} />
        </Route>
        <Route element={<Layout />}>
          <Route path="/equipe" element={<Equipe />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
