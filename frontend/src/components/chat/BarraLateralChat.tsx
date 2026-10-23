import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, LogOut, MessageSquare, PanelLeftClose, Search, SquarePen } from 'lucide-react';
import type { ConversaConsumo } from '../../store/useConsumoStore';
import type { Usuario } from '../../store/useAutenticacaoStore';
import { AlternarTema } from '../AlternarTema';
import logo from '../../assets/acme-logo.svg';

interface Props {
  aberto: boolean; mobile: boolean; conversas: ConversaConsumo[]; ativaId: string | null; usuario: Usuario;
  aoFechar: () => void; aoSelecionar: (id: string) => void; aoCriar: () => void; aoSair: () => void;
  carregando: boolean; temMais: boolean; ocupado: boolean; aoCarregarMais: () => void;
}
export function BarraLateralChat({ aberto, mobile, conversas, ativaId, usuario, aoFechar, aoSelecionar, aoCriar, aoSair, carregando, temMais, ocupado, aoCarregarMais }: Props) {
  const [busca, setBusca] = useState('');
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const elemento = dialogo.current;
    if (mobile && aberto) elemento?.showModal(); else elemento?.close();
    return () => elemento?.close();
  }, [mobile, aberto]);
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const semana = new Date(hoje); semana.setDate(semana.getDate() - 7);
  const filtradas = conversas.filter(c => c.titulo.toLocaleLowerCase('pt-BR').includes(busca.trim().toLocaleLowerCase('pt-BR'))).sort((a, b) => Date.parse(b.atualizadoEm) - Date.parse(a.atualizadoEm));
  const grupos = [
    { titulo: 'Hoje', itens: filtradas.filter(c => Date.parse(c.atualizadoEm) >= +hoje) },
    { titulo: 'Últimos 7 dias', itens: filtradas.filter(c => Date.parse(c.atualizadoEm) < +hoje && Date.parse(c.atualizadoEm) >= +semana) },
    { titulo: 'Anteriores', itens: filtradas.filter(c => Date.parse(c.atualizadoEm) < +semana) },
  ];
  const conteudo = <>
    <div className="chat-sidebar-topo"><Link to="/hub" className="chat-brand" aria-label="Acme — escolher módulo"><img src={logo} alt="" /><span>Acme</span></Link><button className="chat-icon" aria-label="Recolher histórico" onClick={aoFechar}><PanelLeftClose size={19} /></button></div>
    <nav className="chat-nav chat-nav-conversas" aria-label="Busca e conversas"><Link to="/busca"><Search size={17} />Buscar documentos</Link><Link to="/conversas" className="selecionada" aria-current="page"><MessageSquare size={17} />Conversas</Link></nav>
    <button className="chat-nova" onClick={aoCriar}><SquarePen size={18} />Nova conversa</button>
    <div className="chat-busca"><Search size={15} aria-hidden="true" /><input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar conversa" aria-label="Buscar conversas" /></div>
    <div className="chat-historico">
      {grupos.map(grupo => grupo.itens.length > 0 && <section key={grupo.titulo} aria-label={grupo.titulo}><h2>{grupo.titulo}</h2><ul>{grupo.itens.map(c => <li key={c.id}><button className={ativaId === c.id ? 'selecionada' : ''} aria-current={ativaId === c.id ? 'page' : undefined} title={c.titulo} onClick={() => aoSelecionar(c.id)}><MessageSquare size={15} aria-hidden="true" /><span>{c.titulo}</span></button></li>)}</ul></section>)}
      {!filtradas.length && !carregando && <div className="chat-historico-vazio"><MessageSquare size={20} aria-hidden="true" /><p>{busca ? 'Nenhuma conversa encontrada no histórico carregado.' : 'Suas conversas ficam aqui.'}</p>{busca ? <button onClick={() => setBusca('')}>Limpar busca</button> : <span>Comece uma e retome quando quiser.</span>}</div>}
      {carregando && <p className="chat-historico-vazio" role="status">Carregando conversas…</p>}
      {temMais && <button className="chat-nova" disabled={carregando || ocupado} onClick={aoCarregarMais}>Carregar mais conversas</button>}
    </div>
    <div className="chat-sidebar-base"><Link to="/hub"><LayoutGrid size={17} />Trocar módulo</Link><div className="chat-conta"><span className="chat-avatar" aria-hidden="true">{usuario.nome.trim().slice(0, 1).toUpperCase()}</span><span className="chat-conta-nome">{usuario.nome}<small>Histórico da sua conta</small></span><AlternarTema /><button className="chat-icon" title="Sair" aria-label="Sair" onClick={aoSair}><LogOut size={17} /></button></div></div>
  </>;
  if (mobile) return <dialog ref={dialogo} id="chat-sidebar" className="chat-sidebar chat-sidebar-dialog" aria-label="Histórico e navegação" onCancel={e => { e.preventDefault(); aoFechar(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX > r.right || e.clientY > r.bottom) aoFechar(); } }}>{conteudo}</dialog>;
  return <aside id="chat-sidebar" className="chat-sidebar" hidden={!aberto} aria-label="Histórico e navegação">{conteudo}</aside>;
}
