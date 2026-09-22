import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, MessageSquare, MoreHorizontal, PanelLeftOpen, Pencil, SquarePen, Trash2, X } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta, useGerenciamentoStore } from '../store/useGerenciamentoStore';
import { useConsumoStore } from '../store/useConsumoStore';
import { ConfirmarExclusao } from '../components/gerenciamento/ConfirmarExclusao';
import { BarraLateralChat } from '../components/chat/BarraLateralChat';
import { CompositorChat } from '../components/chat/CompositorChat';
import { MensagensChat } from '../components/chat/MensagensChat';
import '../components/chat/Chat.css';

export function Conversas() {
  const usuario = useAutenticacaoStore(s => s.usuario)!;
  const sair = useAutenticacaoStore(s => s.sair);
  const conta = identificarConta(usuario);
  const { fontes, erroLeitura: erroFontes, carregar: carregarFontes } = useGerenciamentoStore(s => s);
  const { conversas, iniciar, enviar, renomear, excluir, carregar, erroLeitura } = useConsumoStore(s => s);
  const [parametros, setParametros] = useSearchParams();
  const id = parametros.get('conversa');
  const minhasFontes = fontes.filter(f => f.conta === conta);
  const minhasConversas = conversas.filter(c => c.conta === conta);
  const ativa = minhasConversas.find(c => c.id === id);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [entrada, setEntrada] = useState('');
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [historicoAberto, setHistoricoAberto] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [exclusao, setExclusao] = useState(false);
  const campo = useRef<HTMLTextAreaElement>(null);
  const historicoBotao = useRef<HTMLButtonElement>(null);
  const acoes = useRef<HTMLDetailsElement>(null);
  const idsValidos = selecionadas.filter(fid => minhasFontes.some(f => f.id === fid));
  const fonteIndisponivel = !!ativa?.fontes.some(f => !minhasFontes.some(atual => atual.id === f.id));
  const bloqueado = !!erroFontes || !!erroLeitura || fonteIndisponivel || (!!id && !ativa) || (!ativa && !idsValidos.length);

  useEffect(() => { setEntrada(''); setErro(''); setEditando(false); setExclusao(false); if (acoes.current) acoes.current.open = false; }, [id]);
  useEffect(() => { setSelecionadas(ids => ids.filter(fid => fontes.some(f => f.id === fid && f.conta === conta))); }, [fontes, conta]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const adaptar = () => { setMobile(media.matches); setHistoricoAberto(!media.matches); };
    media.addEventListener('change', adaptar);
    return () => media.removeEventListener('change', adaptar);
  }, []);

  function fecharHistorico() { setHistoricoAberto(false); requestAnimationFrame(() => historicoBotao.current?.focus()); }
  function nova() {
    setParametros({}); setSelecionadas([]); setEntrada(''); setErro(''); setAviso(''); setEditando(false); setExclusao(false);
    if (mobile) setHistoricoAberto(false);
    requestAnimationFrame(() => campo.current?.focus());
  }
  function selecionar(conversa: string) {
    setParametros({ conversa }); setAviso('');
    if (mobile) setHistoricoAberto(false);
    requestAnimationFrame(() => campo.current?.focus());
  }
  function enviarPergunta(e: FormEvent) {
    e.preventDefault();
    if (bloqueado || !entrada.trim()) return;
    try {
      if (ativa) enviar(conta, ativa.id, fontes, entrada);
      else setParametros({ conversa: iniciar(conta, fontes, idsValidos, entrada) });
      setEntrada(''); setErro(''); setAviso('Resposta adicionada à conversa.');
      requestAnimationFrame(() => campo.current?.focus());
    } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível enviar. Tente novamente.'); }
  }
  function salvarTitulo(e: FormEvent) {
    e.preventDefault();
    if (!ativa) return;
    try { renomear(conta, ativa.id, titulo); setEditando(false); setErro(''); setAviso('Título atualizado.'); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível renomear.'); }
  }

  return <div className={`chat-app${historicoAberto && !mobile ? ' chat-com-sidebar' : ''}`}>
    <a className="chat-skip" href="#chat-conteudo">Pular para a conversa</a>
    <p className="chat-sr-only" role="status">{aviso}</p>
    <BarraLateralChat aberto={historicoAberto} mobile={mobile} conversas={minhasConversas} ativaId={id} usuario={usuario} aoFechar={fecharHistorico} aoSelecionar={selecionar} aoCriar={nova} aoSair={sair} />
    <main id="chat-conteudo" className="chat-main" tabIndex={-1}>
      {ativa && <h1 className="chat-sr-only">{ativa.titulo}</h1>}
      <header className="chat-header">
        <div className="chat-header-inicio">
          <button ref={historicoBotao} className="chat-icon" aria-label={historicoAberto ? 'Recolher histórico' : 'Abrir histórico'} aria-expanded={historicoAberto} aria-controls="chat-sidebar" onClick={() => setHistoricoAberto(!historicoAberto)}><PanelLeftOpen size={20} /></button>
          {!historicoAberto && <button className="chat-icon" aria-label="Nova conversa" title="Nova conversa" onClick={nova}><SquarePen size={20} /></button>}
          <span className="chat-header-nome">Prisma Norte<span>Conversas</span></span>
        </div>
        {ativa && <>
          <span className="chat-header-titulo" title={ativa.titulo}>{ativa.titulo}</span>
          <details className="chat-acoes" ref={acoes} onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}>
            <summary className="chat-icon" aria-label="Opções da conversa"><MoreHorizontal size={22} /></summary>
            <div className="chat-acoes-menu"><button disabled={!!erroLeitura} onClick={() => { setTitulo(ativa.titulo); setEditando(true); setErro(''); if (acoes.current) acoes.current.open = false; }}><Pencil size={16} />Renomear conversa</button><button className="chat-danger" disabled={!!erroLeitura} onClick={() => { setExclusao(true); if (acoes.current) acoes.current.open = false; }}><Trash2 size={16} />Excluir conversa</button></div>
          </details>
        </>}
      </header>
      {erroFontes && <div className="chat-alerta" role="alert">{erroFontes}<button onClick={carregarFontes}>Recarregar fontes</button></div>}
      {erroLeitura && <div className="chat-alerta" role="alert">{erroLeitura}<button onClick={carregar}>Recarregar conversas</button></div>}
      {editando && <form className="chat-renomear" onSubmit={salvarTitulo}><label htmlFor="chat-titulo">Título da conversa</label><div><input id="chat-titulo" autoFocus required maxLength={80} value={titulo} onChange={e => setTitulo(e.target.value)} /><button className="chat-icon" aria-label="Salvar título"><Check size={18} /></button><button className="chat-icon" type="button" aria-label="Cancelar renomeação" onClick={() => { setEditando(false); setErro(''); }}><X size={18} /></button></div>{erro && <p role="alert">{erro}</p>}</form>}
      {id && !ativa ? <div className="chat-indisponivel"><MessageSquare size={28} /><h1>Conversa indisponível</h1><p>Escolha uma conversa do histórico ou comece outra.</p><button className="chat-primary" onClick={nova}>Nova conversa</button></div> : <div className={`chat-corpo${ativa ? ' chat-em-andamento' : ' chat-inicial'}`}>
        {ativa ? <MensagensChat mensagens={ativa.mensagens} conversaId={ativa.id} /> : <div className="chat-boas-vindas"><h1>Vamos conversar com<br />seus documentos.</h1><p>O conhecimento já está nas suas fontes.<br className="chat-quebra-mobile" /> Encontre as respostas aqui.</p></div>}
        <div className="chat-area-compositor">
          {fonteIndisponivel && <p className="chat-alerta" role="alert">Uma fonte foi excluída. Inicie outra conversa para selecionar novas fontes.</p>}
          {erro && !editando && <p className="chat-alerta" role="alert">{erro}</p>}
          <CompositorChat campo={campo} entrada={entrada} aoMudar={setEntrada} aoEnviar={enviarPergunta} bloqueado={bloqueado} fontes={minhasFontes} selecionadas={idsValidos} aoSelecionar={setSelecionadas} fontesFixas={ativa?.fontes} desabilitarFontes={!!erroFontes || !!erroLeitura} />
          {!ativa && <div className="chat-sugestoes" aria-label="Sugestões de perguntas">{['Quais são os benefícios disponíveis?', 'Como funciona a revisão de código?', 'Como publicar uma nova versão?'].map(pergunta => <button key={pergunta} onClick={() => { setEntrada(pergunta); campo.current?.focus(); }}>{pergunta}</button>)}</div>}
          <p className="chat-rodape">{ativa ? 'Confira as fontes. Respostas podem conter imprecisões.' : 'Selecione suas fontes de dados para começar.'}</p>
        </div>
      </div>}
    </main>
    {exclusao && ativa && <ConfirmarExclusao tipo="conversa" nome={ativa.titulo} aoCancelar={() => setExclusao(false)} aoConfirmar={() => { excluir(conta, ativa.id); nova(); setAviso('Conversa excluída.'); }} />}
  </div>;
}
