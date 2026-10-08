import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { Database, KeyRound, LayoutGrid, LogOut, PanelLeftClose, PanelLeftOpen, UploadCloud } from 'lucide-react';
import { AlternarTema } from './AlternarTema';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta } from '../store/useGerenciamentoStore';
import { useFontesDadosStore } from '../store/useFontesDadosStore';
import { ModalIndexacao } from './gerenciamento/ModalIndexacao';
import logo from '../assets/fluidocs-logo.png';
import './gerenciamento/Gerenciamento.css';
import './chat/Chat.css';

export function LayoutGerenciamento() {
  const { usuario, tokenAcesso, estaAutenticado, sair } = useAutenticacaoStore();
  const { carregar, fontes, carregando, erroLeitura, indexarArquivos } = useFontesDadosStore(s => s);
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [navegacaoAberta, setNavegacaoAberta] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  const dialogo = useRef<HTMLDialogElement>(null);
  const navegacaoBotao = useRef<HTMLButtonElement>(null);
  const origemIndexacao = useRef<HTMLButtonElement | null>(null);
  const [indexacaoAberta, setIndexacaoAberta] = useState(false);

  useEffect(() => {
    if (estaAutenticado && tokenAcesso) void carregar();
  }, [carregar, estaAutenticado, tokenAcesso, pathname]);

  useEffect(() => { setIndexacaoAberta(false); }, [tokenAcesso, pathname]);

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

  const navegacao = <>
    <div className="chat-sidebar-topo">
      <Link to="/hub" className="chat-brand" aria-label="Fluidocs — escolher módulo"><img src={logo} alt="" /><span>fluidocs<span>.</span></span></Link>
      <button className="chat-icon" aria-label="Recolher navegação" onClick={fecharNavegacao}><PanelLeftClose size={19} /></button>
    </div>
    <nav className="chat-nav gestao-nav" aria-label="Gerenciamento">
      <NavLink to="/fontes-de-dados" onClick={() => mobile && fecharNavegacao()}><Database size={17} aria-hidden="true" />Fontes de dados</NavLink>
      <NavLink to="/chaves-api" onClick={() => mobile && fecharNavegacao()}><KeyRound size={17} aria-hidden="true" />Chaves de API</NavLink>
    </nav>
    <button type="button" className="gestao-nav-action" disabled={carregando || !!erroLeitura || !fontes.length} title={!fontes.length ? 'Crie uma fonte de dados para indexar documentos' : undefined} onClick={e => { origemIndexacao.current = e.currentTarget; if (mobile) { dialogo.current?.close(); setNavegacaoAberta(false); } setIndexacaoAberta(true); }}><UploadCloud size={17} aria-hidden="true" />Indexar documentos</button>
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
          <div className="gestao-scroll"><Outlet key={`${identificarConta(usuario)}:${tokenAcesso}`} /></div>
        </main>
      </div>
      {indexacaoAberta && <ModalIndexacao key={tokenAcesso} fontes={fontes} aoIndexar={indexarArquivos} aoFechar={() => { setIndexacaoAberta(false); requestAnimationFrame(() => (mobile ? navegacaoBotao.current : origemIndexacao.current)?.focus()); }} />}
    </div>
  );
}
