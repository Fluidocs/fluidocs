import { useEffect } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, MessageSquare, Monitor, Search } from 'lucide-react';
import { AlternarTema } from './AlternarTema';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { CHAVE_GERENCIAMENTO, identificarConta, useGerenciamentoStore } from '../store/useGerenciamentoStore';
import { CHAVE_CONSUMO, useConsumoStore } from '../store/useConsumoStore';
import logo from '../assets/fluidocs-logo.png';
import './gerenciamento/Gerenciamento.css';
import './consumo/Consumo.css';

export function LayoutConsumo() {
  const { usuario, estaAutenticado, sair } = useAutenticacaoStore();
  const carregarFontes = useGerenciamentoStore(s => s.carregar);
  const erroFontes = useGerenciamentoStore(s => s.erroLeitura);
  const carregarConversas = useConsumoStore(s => s.carregar);
  const erroConversas = useConsumoStore(s => s.erroLeitura);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!estaAutenticado) return;
    carregarFontes(); carregarConversas();
    const sincronizar = (e: StorageEvent) => {
      if (e.key === CHAVE_GERENCIAMENTO || e.key === null) carregarFontes();
      if (e.key === CHAVE_CONSUMO || e.key === null) carregarConversas();
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, [estaAutenticado, carregarFontes, carregarConversas]);
  useEffect(() => {
    const anterior = document.title;
    document.title = `${pathname === '/busca' ? 'Busca de documentos' : 'Conversas'} · Fluidocs`;
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, [pathname]);
  if (!estaAutenticado || !usuario) return <Navigate to="/entrar" replace />;
  if (pathname === '/conversas' || pathname === '/busca') return <div className="gestao chat-route"><Outlet key={identificarConta(usuario)} /></div>;
  return (
    <div className={`gestao consumo${pathname === '/conversas' ? ' consumo-chat-layout' : ''}`}>
      <a className="gestao-skip" href="#consumo-conteudo">Pular para o conteúdo</a>
      <header className="gestao-header">
        <Link to="/hub" className="gestao-brand" aria-label="Fluidocs — escolher módulo"><img src={logo} alt="" width="30" height="36" /><span>fluidocs<span>.</span></span></Link>
        <span className="gestao-module-label">Busca e conversas</span>
        <div className="gestao-account"><span title={usuario.email}>{usuario.nome}</span><AlternarTema /><button className="gestao-button gestao-button-quiet" onClick={sair}><LogOut size={17} aria-hidden="true" />Sair</button></div>
      </header>
      <div className="gestao-shell">
        <aside className="gestao-sidebar">
          <Link to="/hub" className="gestao-switch"><LayoutGrid size={18} aria-hidden="true" />Trocar módulo</Link>
          <nav aria-label="Busca e conversas"><NavLink to="/busca"><Search size={18} aria-hidden="true" />Busca de documentos</NavLink><NavLink to="/conversas"><MessageSquare size={18} aria-hidden="true" />Conversas</NavLink></nav>
          {pathname !== '/conversas' && <div className="gestao-local"><Monitor size={18} aria-hidden="true" /><div><strong>Demonstração local</strong><p>Textos e respostas de exemplo. Histórico salvo neste navegador.</p></div></div>}
        </aside>
        <main id="consumo-conteudo" className="gestao-main" tabIndex={-1}>
          {erroFontes && <div className="gestao-alert" role="alert"><p>{erroFontes}</p><button className="gestao-button" onClick={carregarFontes}>Recarregar fontes</button></div>}
          {erroConversas && <div className="gestao-alert" role="alert"><p>{erroConversas}</p><button className="gestao-button" onClick={carregarConversas}>Recarregar conversas</button></div>}
          <Outlet key={identificarConta(usuario)} />
        </main>
      </div>
    </div>
  );
}
