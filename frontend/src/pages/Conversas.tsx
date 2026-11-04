import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, MessageSquare, MoreHorizontal, PanelLeftOpen, Pencil, SquarePen, Trash2, X } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta } from '../store/useGerenciamentoStore';
import { useFontesConsumoStore } from '../store/useFontesDadosStore';
import { useConsumoStore, type ConversaConsumo, type MensagemConsumo } from '../store/useConsumoStore';
import { extrairMensagemErro } from '../services/api';
import { ConfirmarExclusao } from '../components/gerenciamento/ConfirmarExclusao';
import { BarraLateralChat } from '../components/chat/BarraLateralChat';
import { CompositorChat } from '../components/chat/CompositorChat';
import { MensagensChat } from '../components/chat/MensagensChat';
import '../components/chat/Chat.css';

export function Conversas() {
  const usuario = useAutenticacaoStore(s => s.usuario)!;
  const sair = useAutenticacaoStore(s => s.sair);
  const conta = identificarConta(usuario);
  const { fontes, erroLeitura: erroFontes, carregando: carregandoFontes, carregar: carregarFontes } = useFontesConsumoStore(s => s);
  const { conversas, iniciar, enviar, renomear, excluir, carregar, detalhar, erroLeitura,
    carregando, detalhandoId, erroDetalhe, enviando, alterando, pagina, paginas } = useConsumoStore(s => s);
  const [parametros, setParametros] = useSearchParams();
  const id = parametros.get('conversa');
  const minhasFontes = fontes.filter(f => f.conta === conta);
  const minhasConversas = conversas.filter(c => c.conta === conta);
  const ativa = minhasConversas.find(c => c.id === id);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [entrada, setEntrada] = useState('');
  const [envioPendente, setEnvioPendente] = useState<{ conversaId: string | null; mensagem: MensagemConsumo } | null>(null);
  const perguntaPendente = enviando && envioPendente?.conversaId === id ? envioPendente.mensagem : undefined;
  const emConversa = !!ativa || !!perguntaPendente;
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [historicoAberto, setHistoricoAberto] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [exclusao, setExclusao] = useState<ConversaConsumo | null>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const historicoBotao = useRef<HTMLButtonElement>(null);
  const acoes = useRef<HTMLDetailsElement>(null);
  const contextoVisual = useRef(0);
  const idsValidos = selecionadas.filter(fid => minhasFontes.some(f => f.id === fid));
  const fonteIndisponivel = !!ativa?.fontes.some(f => !minhasFontes.some(atual => atual.id === f.id));
  const fontesFixas = ativa?.fontes.length ? ativa.fontes : undefined;
  const carregandoDetalhe = !!id && (detalhandoId === id || (!ativa?.detalhada && !erroDetalhe));
  const fontesAntigas = !!ativa?.detalhada && !ativa.fontes.length && ativa.mensagens.length > 0;
  const bloqueado = enviando || alterando || carregandoDetalhe || carregandoFontes || !!erroFontes ||
    !!erroLeitura || (!!id && !!erroDetalhe) || fonteIndisponivel || fontesAntigas || (!!id && !ativa) || (!fontesFixas && !idsValidos.length);

  useEffect(() => {
    setEntrada(''); setErro(''); setEditando(false); setExclusao(null);
    if (acoes.current) acoes.current.open = false;
    return () => { contextoVisual.current++; };
  }, [id]);
  useEffect(() => { if (id && !carregando && !enviando && !alterando) void detalhar(id); }, [id, carregando, enviando, alterando, ativa?.detalhada, detalhar]);
  useEffect(() => { setSelecionadas(ids => ids.filter(fid => fontes.some(f => f.id === fid && f.conta === conta))); }, [fontes, conta]);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const adaptar = () => { setMobile(media.matches); setHistoricoAberto(!media.matches); };
    media.addEventListener('change', adaptar);
    return () => media.removeEventListener('change', adaptar);
  }, []);

  function fecharHistorico() { setHistoricoAberto(false); requestAnimationFrame(() => historicoBotao.current?.focus()); }
  function nova() {
    contextoVisual.current++;
    setEnvioPendente(null);
    setParametros({}); setSelecionadas([]); setEntrada(''); setErro(''); setAviso(''); setEditando(false); setExclusao(null);
    if (mobile) setHistoricoAberto(false);
    requestAnimationFrame(() => campo.current?.focus());
  }
  function selecionar(conversa: string) {
    contextoVisual.current++;
    setParametros({ conversa }); setAviso('');
    if (mobile) setHistoricoAberto(false);
    requestAnimationFrame(() => campo.current?.focus());
  }
  async function enviarPergunta(e: FormEvent) {
    e.preventDefault();
    if (bloqueado || !entrada.trim()) return;
    const versao = contextoVisual.current;
    setErro(''); setAviso('');
    setEnvioPendente({ conversaId: id, mensagem: { id: 'pergunta-pendente', papel: 'usuario', conteudo: entrada.trim(), criadoEm: new Date().toISOString(), evidencias: [] } });
    try {
      if (ativa) {
        if (!await enviar(conta, ativa.id, fontes, entrada, idsValidos)) return;
      } else {
        const criada = await iniciar(conta, fontes, idsValidos, entrada);
        if (!criada || versao !== contextoVisual.current) return;
        setParametros({ conversa: criada });
      }
      if (versao !== contextoVisual.current) return;
      setEntrada(''); setErro(''); setAviso('Resposta adicionada à conversa.');
      requestAnimationFrame(() => campo.current?.focus());
    } catch (e) {
      if (versao === contextoVisual.current) setErro(extrairMensagemErro(e, 'Não foi possível enviar. Tente novamente.'));
    } finally {
      setEnvioPendente(null);
    }
  }
  async function salvarTitulo(e: FormEvent) {
    e.preventDefault();
    if (!ativa || enviando || alterando) return;
    const versao = contextoVisual.current;
    try {
      if (await renomear(conta, ativa.id, titulo) && versao === contextoVisual.current) {
        setEditando(false); setErro(''); setAviso('Título atualizado.');
      }
    } catch (e) {
      if (versao === contextoVisual.current) setErro(extrairMensagemErro(e, 'Não foi possível renomear.'));
    }
  }

  return <div className={`chat-app${historicoAberto && !mobile ? ' chat-com-sidebar' : ''}`}>
    <a className="chat-skip" href="#chat-conteudo">Pular para a conversa</a>
    <p className="chat-sr-only" role="status">{aviso}</p>
    <BarraLateralChat aberto={historicoAberto} mobile={mobile} conversas={minhasConversas} ativaId={id} usuario={usuario} aoFechar={fecharHistorico} aoSelecionar={selecionar} aoCriar={nova} aoSair={sair} carregando={carregando} temMais={pagina < paginas} ocupado={enviando || alterando} aoCarregarMais={() => void carregar(true)} aoRenomear={async (conversaId, novoTitulo) => { const atualizado = await renomear(conta, conversaId, novoTitulo); if (atualizado) setAviso('Título atualizado.'); return atualizado; }} aoExcluir={setExclusao} />
    <main id="chat-conteudo" className="chat-main" tabIndex={-1}>
      {ativa && <h1 className="chat-sr-only">{ativa.titulo}</h1>}
      <header className="chat-header">
        <div className="chat-header-inicio">
          <button ref={historicoBotao} className="chat-icon" aria-label={historicoAberto ? 'Recolher histórico' : 'Abrir histórico'} aria-expanded={historicoAberto} aria-controls="chat-sidebar" onClick={() => setHistoricoAberto(!historicoAberto)}><PanelLeftOpen size={20} /></button>
          {!historicoAberto && <button className="chat-icon" aria-label="Nova conversa" title="Nova conversa" onClick={nova}><SquarePen size={20} /></button>}
          <span className="chat-header-nome">Acme<span>Conversas</span></span>
        </div>
        {ativa && <>
          <span className="chat-header-titulo" title={ativa.titulo}>{ativa.titulo}</span>
          <details className="chat-acoes" ref={acoes} onKeyDown={e => { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary')?.focus(); } }}>
            <summary className="chat-icon" aria-label="Opções da conversa"><MoreHorizontal size={22} /></summary>
            <div className="chat-acoes-menu"><button disabled={enviando || alterando || carregandoDetalhe} onClick={() => { setTitulo(ativa.titulo); setEditando(true); setErro(''); if (acoes.current) acoes.current.open = false; }}><Pencil size={16} />Renomear conversa</button><button className="chat-danger" disabled={enviando || alterando || carregandoDetalhe} onClick={() => { setExclusao(ativa); if (acoes.current) acoes.current.open = false; }}><Trash2 size={16} />Excluir conversa</button></div>
          </details>
        </>}
      </header>
      {erroFontes && <div className="chat-alerta" role="alert">{erroFontes}<button onClick={carregarFontes}>Recarregar fontes</button></div>}
      {carregandoFontes && <p className="chat-alerta" role="status">Carregando suas fontes…</p>}
      {erroLeitura && <div className="chat-alerta" role="alert">{erroLeitura}<button disabled={carregando || enviando || alterando} onClick={() => void carregar()}>Recarregar conversas</button></div>}
      {id && erroDetalhe && <div className="chat-alerta" role="alert">{erroDetalhe}<button onClick={() => void detalhar(id, true)}>Recarregar mensagens</button></div>}
      {editando && <form className="chat-renomear" onSubmit={salvarTitulo} aria-busy={alterando}><label htmlFor="chat-titulo">Título da conversa</label><div><input id="chat-titulo" autoFocus required maxLength={255} disabled={alterando} value={titulo} onChange={e => setTitulo(e.target.value)} /><button disabled={alterando} className="chat-icon" aria-label={alterando ? 'Salvando título' : 'Salvar título'}><Check size={18} /></button><button disabled={alterando} className="chat-icon" type="button" aria-label="Cancelar renomeação" onClick={() => { setEditando(false); setErro(''); }}><X size={18} /></button></div>{erro && <p role="alert">{erro}</p>}</form>}
      {carregandoDetalhe ? <div className="chat-indisponivel" role="status"><MessageSquare size={28} /><p>Carregando mensagens…</p></div> : id && !ativa ? <div className="chat-indisponivel"><MessageSquare size={28} /><h1>Conversa indisponível</h1><p>Escolha uma conversa do histórico ou comece outra.</p><button className="chat-primary" onClick={nova}>Nova conversa</button></div> : <div className={`chat-corpo${emConversa ? ' chat-em-andamento' : ' chat-inicial'}`}>
        {emConversa ? <MensagensChat mensagens={[...(ativa?.mensagens ?? []), ...(perguntaPendente ? [perguntaPendente] : [])]} conversaId={ativa?.id ?? 'nova'} enviando={!!perguntaPendente} /> : <div className="chat-boas-vindas"><h1>Vamos conversar com<br />seus documentos.</h1><p>O conhecimento já está nas suas fontes.<br className="chat-quebra-mobile" /> Encontre as respostas aqui.</p></div>}
        <div className="chat-area-compositor">
          {fonteIndisponivel && <p className="chat-alerta" role="alert">Uma fonte foi excluída. Inicie outra conversa para selecionar novas fontes.</p>}
          {fontesAntigas && <p className="chat-alerta" role="alert">As fontes desta conversa não estão salvas neste navegador e a API não informa a seleção original. Inicie outra conversa para continuar.</p>}
          {erro && !editando && <p className="chat-alerta" role="alert">{erro}</p>}
          <CompositorChat campo={campo} entrada={entrada} aoMudar={setEntrada} aoEnviar={enviarPergunta} bloqueado={bloqueado} enviando={enviando} fontes={minhasFontes} selecionadas={idsValidos} aoSelecionar={setSelecionadas} fontesFixas={fontesFixas} desabilitarFontes={enviando || alterando || carregandoFontes || !!erroFontes || !!erroLeitura} />
          {!emConversa && <div className="chat-sugestoes" aria-label="Sugestões de perguntas">{['Quais são os benefícios disponíveis?', 'Como funciona a revisão de código?', 'Como publicar uma nova versão?'].map(pergunta => <button key={pergunta} disabled={enviando || alterando} onClick={() => { setEntrada(pergunta); campo.current?.focus(); }}>{pergunta}</button>)}</div>}
          <p className="chat-rodape">{emConversa ? 'Confira as fontes. Respostas podem conter imprecisões.' : 'Selecione suas fontes de dados para começar.'}</p>
        </div>
      </div>}
    </main>
    {exclusao && <ConfirmarExclusao tipo="conversa" nome={exclusao.titulo} aoCancelar={() => setExclusao(null)} aoConfirmar={async () => { const versao = contextoVisual.current; if (await excluir(conta, exclusao.id) && versao === contextoVisual.current) { if (exclusao.id === id) nova(); else setExclusao(null); setAviso('Conversa excluída.'); } }} />}
  </div>;
}
