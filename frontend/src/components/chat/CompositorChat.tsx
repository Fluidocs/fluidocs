import { useEffect, type FormEvent, type RefObject } from 'react';
import { ArrowUp } from 'lucide-react';
import type { FonteDados } from '../../store/useGerenciamentoStore';
import type { FonteConsulta } from '../../services/consumoDemo';
import { FontesChat } from './FontesChat';

interface Props {
  campo: RefObject<HTMLTextAreaElement | null>; entrada: string; aoMudar: (valor: string) => void;
  aoEnviar: (e: FormEvent) => void; bloqueado: boolean; fontes: FonteDados[]; selecionadas: string[];
  aoSelecionar: (ids: string[]) => void; fontesFixas?: FonteConsulta[]; desabilitarFontes: boolean;
  enviando?: boolean;
}
export function CompositorChat({ campo, entrada, aoMudar, aoEnviar, bloqueado, fontes, selecionadas, aoSelecionar, fontesFixas, desabilitarFontes, enviando = false }: Props) {
  useEffect(() => {
    if (!campo.current) return;
    campo.current.style.height = 'auto';
    campo.current.style.height = `${Math.min(campo.current.scrollHeight, 180)}px`;
  }, [entrada, campo]);
  return <form className="chat-compositor" onSubmit={aoEnviar} aria-busy={enviando}>
    <label htmlFor="chat-pergunta" className="chat-sr-only">{fontesFixas ? 'Continue a conversa' : 'Sua pergunta'}</label>
    <textarea id="chat-pergunta" ref={campo} rows={1} maxLength={2000} required readOnly={enviando} value={entrada} onChange={e => aoMudar(e.target.value)} placeholder={fontesFixas ? 'Continue a conversa…' : 'O que você quer saber?'} aria-describedby="chat-dica-envio" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing && !window.matchMedia('(pointer: coarse)').matches) { e.preventDefault(); e.currentTarget.form?.requestSubmit(); } }} />
    <div className="chat-compositor-ferramentas"><FontesChat fontes={fontes} selecionadas={selecionadas} aoMudar={aoSelecionar} fixas={fontesFixas} desabilitado={desabilitarFontes} /><span id="chat-dica-envio" className="chat-dica-envio">{fontesFixas ? 'Enter para enviar' : selecionadas.length ? `${selecionadas.length} fonte${selecionadas.length > 1 ? 's' : ''} selecionada${selecionadas.length > 1 ? 's' : ''}` : 'Escolha o contexto'}</span><button className="chat-enviar" title="Enviar pergunta" aria-label="Enviar pergunta" disabled={bloqueado || !entrada.trim()}><ArrowUp size={20} /></button></div>
  </form>;
}
