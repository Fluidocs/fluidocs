import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Database, KeyRound, LayoutGrid, LogOut, PanelLeftClose, PanelLeftOpen, UploadCloud } from 'lucide-react';
import { AlternarTema } from './AlternarTema';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { CHAVE_GERENCIAMENTO, identificarConta, useGerenciamentoStore } from '../store/useGerenciamentoStore';
import logo from '../assets/fluidocs-logo.png';
import { ModalIndexacao } from './gerenciamento/ModalIndexacao';
import './gerenciamento/Gerenciamento.css';
import './chat/Chat.css';

export function LayoutGerenciamento() {
  const { usuario, estaAutenticado, sair } = useAutenticacaoStore();
  const carregar = useGerenciamentoStore(s => s.carregar);
  const erro = useGerenciamentoStore(s => s.erroLeitura);
  const fontes = useGerenciamentoStore(s => s.fontes);
  const registrarDocumentos = useGerenciamentoStore(s => s.registrarDocumentos);
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [navegacaoAberta, setNavegacaoAberta] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  const [indexacaoAberta, setIndexacaoAberta] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const navegacaoBotao = useRef<HTMLButtonElement>(null);
  const indexacaoBotao = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!estaAutenticado) return;
    carregar();
    const sincronizar = (evento: StorageEvent) => {
      if (evento.key === CHAVE_GERENCIAMENTO || evento.key === null) carregar();
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, [carregar, estaAutenticado]);

  useEffect(() => {
    const anterior = document.title;
    document.title = `${pathname === '/chaves-api' ? 'Chaves de API' : 'Fontes de Dados'} · Fluidocs`;
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, [pathname]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const adaptar = () => { setMobile(media.matches); setNavegacaoAberta(!media.matches); };
    media.addEventListener('change', adaptar);
    return () => media.removeEventListener('change', adaptar);
  }, []);

  useEffect(() => {
    const elemento = dialogo.current;
    if (mobile && navegacaoAberta) elemento?.showModal();
    else elemento?.close();
    return () => elemento?.close();
  }, [mobile, navegacaoAberta]);

  if (!estaAutenticado || !usuario) return <Navigate to="/entrar" replace />;

  function fecharNavegacao() {
    setNavegacaoAberta(false);
    requestAnimationFrame(() => navegacaoBotao.current?.focus());
  }

  function abrirIndexacao() {
    if (mobile) setNavegacaoAberta(false);
    requestAnimationFrame(() => setIndexacaoAberta(true));
  }

  function fecharIndexacao() {
    setIndexacaoAberta(false);
    requestAnimationFrame(() => (mobile ? navegacaoBotao.current : indexacaoBotao.current)?.focus());
  }

  const navegacao = <>
    <div className="chat-sidebar-topo">
      <Link to="/hub" className="chat-brand" aria-label="Fluidocs — escolher módulo"><img src={logo} alt="" /><span>fluidocs<span>.</span></span></Link>
      <button className="chat-icon" aria-label="Recolher navegação" onClick={fecharNavegacao}><PanelLeftClose size={19} /></button>
    </div>
    <nav className="chat-nav gestao-nav" aria-label="Gerenciamento">
      <NavLink to="/fontes-de-dados" onClick={() => mobile && fecharNavegacao()}><Database size={17} aria-hidden="true" />Fontes de dados</NavLink>
      <NavLink to="/chaves-api" onClick={() => mobile && fecharNavegacao()}><KeyRound size={17} aria-hidden="true" />Chaves de API</NavLink>
    </nav>
    <button ref={indexacaoBotao} type="button" className="gestao-nav-action" onClick={abrirIndexacao}><UploadCloud size={17} aria-hidden="true" />Indexar documentos</button>
    <div className="chat-sidebar-base">
      <Link to="/hub"><LayoutGrid size={17} aria-hidden="true" />Trocar módulo</Link>
      <div className="chat-conta">
        <span className="chat-avatar" aria-hidden="true">{usuario.nome.trim().slice(0, 1).toUpperCase()}</span>
        <span className="chat-conta-nome">{usuario.nome}<small>Gerenciamento</small></span>
        <AlternarTema />
        <button className="chat-icon" title="Sair" aria-label="Sair" onClick={sair}><LogOut size={17} /></button>
      </div>
    </div>
  </>;

  return (
    <div className="gestao chat-route">
      <a className="gestao-skip" href="#gestao-conteudo">Pular para o conteúdo</a>
      <div className={`chat-app${navegacaoAberta && !mobile ? ' chat-com-sidebar' : ''}`}>
        {mobile ? <dialog ref={dialogo} id="gestao-sidebar" className="chat-sidebar chat-sidebar-dialog" aria-label="Navegação do gerenciamento" onCancel={e => { e.preventDefault(); fecharNavegacao(); }} onClick={e => { if (e.target !== e.currentTarget) return; const r = e.currentTarget.getBoundingClientRect(); if (e.clientX > r.right || e.clientY > r.bottom) fecharNavegacao(); }}>{navegacao}</dialog> : <aside id="gestao-sidebar" className="chat-sidebar" hidden={!navegacaoAberta} aria-label="Navegação do gerenciamento">{navegacao}</aside>}
        <main id="gestao-conteudo" className="chat-main gestao-main" tabIndex={-1}>
          <header className="chat-header gestao-topbar">
            <div className="chat-header-inicio"><button ref={navegacaoBotao} className="chat-icon" aria-label={navegacaoAberta ? 'Recolher navegação' : 'Abrir navegação'} aria-expanded={navegacaoAberta} aria-controls="gestao-sidebar" onClick={() => setNavegacaoAberta(!navegacaoAberta)}><PanelLeftOpen size={20} /></button><span className="chat-header-nome">Fluidocs<span>Gerenciamento</span></span></div>
            <span className="gestao-topbar-account" title={usuario.email}>{usuario.nome}</span>
          </header>
          {erro && pathname !== '/chaves-api' && <div className="gestao-alert" role="alert"><p>{erro}</p><button className="gestao-button" onClick={carregar}>Tentar novamente</button></div>}
          <div className="gestao-scroll"><Outlet key={identificarConta(usuario)} /></div>
        </main>
      </div>
      {indexacaoAberta && <ModalIndexacao fontes={fontes.filter(fonte => fonte.conta === identificarConta(usuario))} aoFechar={fecharIndexacao} aoIndexar={(fonteId, nomes) => registrarDocumentos(identificarConta(usuario), fonteId, nomes)} />}
    </div>
  );
}
