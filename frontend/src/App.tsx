import React from 'react';
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

export default function App() {
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
