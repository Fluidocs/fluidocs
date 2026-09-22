import { useEffect, useRef, useState } from 'react';
import { ArrowDown, Check, ChevronDown, Copy, FileText } from 'lucide-react';
import type { MensagemConsumo } from '../../store/useConsumoStore';
import logo from '../../assets/fluidocs-logo.png';

export function MensagensChat({ mensagens, conversaId }: { mensagens: MensagemConsumo[]; conversaId: string }) {
  const painel = useRef<HTMLDivElement>(null);
  const [longeDoFim, setLongeDoFim] = useState(false);
  useEffect(() => { if (painel.current) { painel.current.scrollTop = painel.current.scrollHeight; setLongeDoFim(false); } }, [conversaId, mensagens.length]);
  return <div className="chat-transcript-wrap"><div ref={painel} className="chat-transcript" role="region" aria-label="Mensagens da conversa" tabIndex={0} onScroll={e => { const p = e.currentTarget; setLongeDoFim(p.scrollHeight - p.scrollTop - p.clientHeight > 160); }}><div className="chat-transcript-conteudo">{mensagens.map(m => <MensagemChat key={m.id} mensagem={m} />)}</div></div>{longeDoFim && <button className="chat-ir-fim chat-icon" aria-label="Ir para a última mensagem" onClick={() => painel.current?.scrollTo({ top: painel.current.scrollHeight, behavior: 'instant' })}><ArrowDown size={18} /></button>}</div>;
}

function MensagemChat({ mensagem: m }: { mensagem: MensagemConsumo }) {
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copiar() {
    try { await navigator.clipboard.writeText(m.conteudo); setCopiado(true); setErro(''); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => setCopiado(false), 2000); }
    catch { setErro('Não foi possível copiar. Selecione o texto e copie manualmente.'); }
  }
  return <article className={`chat-mensagem chat-mensagem-${m.papel}`} aria-label={m.papel === 'usuario' ? 'Sua mensagem' : 'Resposta do Fluidocs'}>
    {m.papel === 'assistente' && <div className="chat-assistente-identidade"><img src={logo} alt="" /><span>Fluidocs</span></div>}
    <div className="chat-mensagem-texto">{m.conteudo.split('\n\n').map((p, i) => <p key={i}>{p}</p>)}</div>
    {m.evidencias.length > 0 && <details className="chat-evidencias"><summary><FileText size={15} /><span>{m.evidencias.length} arquivo{m.evidencias.length > 1 ? 's' : ''} usado{m.evidencias.length > 1 ? 's' : ''}</span><ChevronDown size={14} /></summary><div className="chat-evidencias-lista">{m.evidencias.map((d, i) => <details key={d.id} className="chat-evidencia"><summary><span className="chat-citacao">{i + 1}</span><span>{d.nome}<small>{d.fonteNome}</small></span><ChevronDown size={15} /></summary><blockquote>{d.trecho}</blockquote></details>)}</div></details>}
    {m.papel === 'assistente' && <div className="chat-mensagem-acoes"><button className="chat-icon" aria-label={copiado ? 'Resposta copiada' : 'Copiar resposta'} title={copiado ? 'Copiado' : 'Copiar resposta'} onClick={copiar}>{copiado ? <Check size={16} /> : <Copy size={16} />}</button><span role="status">{copiado ? 'Copiado' : erro}</span></div>}
  </article>;
}
