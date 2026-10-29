import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, LayoutGrid, LogOut, MessageSquare, PanelLeftClose, Pencil, Search, SquarePen, Trash2, X } from 'lucide-react';
import { extrairMensagemErro } from '../../services/api';
import type { ConversaConsumo } from '../../store/useConsumoStore';
import type { Usuario } from '../../store/useAutenticacaoStore';
import { AlternarTema } from '../AlternarTema';
import logo from '../../assets/acme-logo.svg';

interface Props {
  aberto: boolean; mobile: boolean; conversas: ConversaConsumo[]; ativaId: string | null; usuario: Usuario;
  aoFechar: () => void; aoSelecionar: (id: string) => void; aoCriar: () => void; aoSair: () => void;
  carregando: boolean; temMais: boolean; ocupado: boolean; aoCarregarMais: () => void;
  aoRenomear: (id: string, titulo: string) => Promise<boolean>;
  aoExcluir: (conversa: ConversaConsumo) => void;
}
export function BarraLateralChat({ aberto, mobile, conversas, ativaId, usuario, aoFechar, aoSelecionar, aoCriar, aoSair, carregando, temMais, ocupado, aoCarregarMais, aoRenomear, aoExcluir }: Props) {
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [titulo, setTitulo] = useState('');
  const [erro, setErro] = useState('');
  const botoesRenomear = useRef(new Map<string, HTMLButtonElement>());
  const salvando = useRef(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const elemento = dialogo.current;
    if (mobile && aberto) elemento?.showModal(); else elemento?.close();
    return () => elemento?.close();
  }, [mobile, aberto]);
  function fecharEdicao() {
    const anteriorId = editandoId;
    setEditandoId(null); setErro('');
    requestAnimationFrame(() => { if (anteriorId) botoesRenomear.current.get(anteriorId)?.focus(); });
  }
  async function salvarTitulo(e: FormEvent) {
    e.preventDefault();
    if (!editandoId || ocupado || salvando.current) return;
    salvando.current = true; setErro('');
    try { if (await aoRenomear(editandoId, titulo)) fecharEdicao(); }
    catch (e) { setErro(extrairMensagemErro(e, 'Não foi possível renomear. Tente novamente.')); }
    finally { salvando.current = false; }
  }
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
      {grupos.map(grupo => grupo.itens.length > 0 && <section key={grupo.titulo} aria-label={grupo.titulo}><h2>{grupo.titulo}</h2><ul>{grupo.itens.map(c => <li key={c.id}>
        {editandoId === c.id ? <form className="chat-historico-edicao" aria-label={`Renomear conversa: ${c.titulo}`} aria-busy={ocupado} onSubmit={salvarTitulo} onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); if (!ocupado && !salvando.current) fecharEdicao(); } }}>
          <label className="chat-sr-only" htmlFor={`chat-titulo-${c.id}`}>Título da conversa</label>
          <div><input id={`chat-titulo-${c.id}`} autoFocus onFocus={e => e.currentTarget.select()} required maxLength={255} disabled={ocupado} value={titulo} onChange={e => setTitulo(e.target.value)} aria-invalid={!!erro} aria-describedby={erro ? `chat-titulo-erro-${c.id}` : undefined} />
            <button className="chat-icon" disabled={ocupado || !titulo.trim()} aria-label={ocupado ? 'Salvando título' : 'Salvar título'} title="Salvar título"><Check size={16} aria-hidden="true" /></button>
            <button className="chat-icon" type="button" disabled={ocupado} aria-label="Cancelar renomeação" title="Cancelar renomeação" onClick={fecharEdicao}><X size={16} aria-hidden="true" /></button></div>
          {erro && <p id={`chat-titulo-erro-${c.id}`} role="alert">{erro}</p>}
        </form> : <div className={`chat-historico-item${ativaId === c.id ? ' selecionada' : ''}`}>
          <button className="chat-historico-selecionar" aria-current={ativaId === c.id ? 'page' : undefined} title={c.titulo} onClick={() => aoSelecionar(c.id)}><MessageSquare size={15} aria-hidden="true" /><span>{c.titulo}</span></button>
          <button ref={elemento => { if (elemento) botoesRenomear.current.set(c.id, elemento); else botoesRenomear.current.delete(c.id); }} className="chat-icon" disabled={ocupado} aria-label={`Renomear conversa: ${c.titulo}`} title="Renomear conversa" onClick={() => { setTitulo(c.titulo); setEditandoId(c.id); setErro(''); }}><Pencil size={15} aria-hidden="true" /></button>
          <button className="chat-icon chat-danger" disabled={ocupado} aria-label={`Excluir conversa: ${c.titulo}`} title="Excluir conversa" onClick={() => aoExcluir(c)}><Trash2 size={15} aria-hidden="true" /></button>
        </div>}
      </li>)}</ul></section>)}
      {!filtradas.length && !carregando && <div className="chat-historico-vazio"><MessageSquare size={20} aria-hidden="true" /><p>{busca ? 'Nenhuma conversa encontrada no histórico carregado.' : 'Suas conversas ficam aqui.'}</p>{busca ? <button onClick={() => setBusca('')}>Limpar busca</button> : <span>Comece uma e retome quando quiser.</span>}</div>}
      {carregando && <p className="chat-historico-vazio" role="status">Carregando conversas…</p>}
      {temMais && <button className="chat-nova" disabled={carregando || ocupado} onClick={aoCarregarMais}>Carregar mais conversas</button>}
    </div>
    <div className="chat-sidebar-base"><Link to="/hub"><LayoutGrid size={17} />Trocar módulo</Link><div className="chat-conta"><span className="chat-avatar" aria-hidden="true">{usuario.nome.trim().slice(0, 1).toUpperCase()}</span><span className="chat-conta-nome">{usuario.nome}<small>Histórico da sua conta</small></span><AlternarTema /><button className="chat-icon" title="Sair" aria-label="Sair" onClick={aoSair}><LogOut size={17} /></button></div></div>
  </>;
  if (mobile) return <dialog ref={dialogo} id="chat-sidebar" className="chat-sidebar chat-sidebar-dialog" aria-label="Histórico e navegação" onCancel={e => { e.preventDefault(); aoFechar(); }} onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX > r.right || e.clientY > r.bottom) aoFechar(); } }}>{conteudo}</dialog>;
  return <aside id="chat-sidebar" className="chat-sidebar" hidden={!aberto} aria-label="Histórico e navegação">{conteudo}</aside>;
}
