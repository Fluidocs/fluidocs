import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Inicio } from './pages/Inicio';
import { Login } from './pages/Entrar';
import { Cadastrar } from './pages/Cadastrar';
import { Busca } from './pages/Busca';
import { Assistente } from './pages/Assistente';
import { Repositorios } from './pages/Repositorios';
import { Equipe } from './pages/Equipe';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/entrar" element={<Login />} />
        <Route path="/cadastrar" element={<Cadastrar />} />
        
        <Route element={<Layout />}>
          <Route path="/busca" element={<Busca />} />
          <Route path="/assistente" element={<Assistente />} />
          <Route path="/repositorios" element={<Repositorios />} />
          <Route path="/equipe" element={<Equipe />} />
          <Route path="/hub" element={<Navigate to="/busca" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
