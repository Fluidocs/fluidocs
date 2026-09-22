import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Database, LockKeyhole, Search } from 'lucide-react';
import type { FonteDados } from '../../store/useGerenciamentoStore';
import type { FonteConsulta } from '../../services/consumoDemo';

interface Props { fontes: FonteDados[]; selecionadas: string[]; aoMudar: (ids: string[]) => void; fixas?: FonteConsulta[]; desabilitado: boolean; contexto?: 'conversa' | 'busca' }
export function FontesChat({ fontes, selecionadas, aoMudar, fixas, desabilitado, contexto = 'conversa' }: Props) {
  const id = useId();
  const painel = useRef<HTMLDivElement>(null);
  const [busca, setBusca] = useState('');
  const [aberto, setAberto] = useState(false);
  useEffect(() => {
    const fechar = () => painel.current?.hidePopover();
    window.addEventListener('resize', fechar);
    return () => window.removeEventListener('resize', fechar);
  }, []);
  const itens = (fixas ?? fontes).filter(f => f.nome.toLocaleLowerCase('pt-BR').includes(busca.toLocaleLowerCase('pt-BR')));
  function posicionar(botao: HTMLButtonElement) {
    const r = botao.getBoundingClientRect();
    if (painel.current) {
      painel.current.style.left = `${Math.max(12, Math.min(r.left, window.innerWidth - 352))}px`;
      painel.current.style.bottom = `${window.innerHeight - r.top + 10}px`;
      painel.current.style.maxHeight = `${Math.max(120, r.top - 24)}px`;
    }
  }
  return <>
    <button type="button" className={`chat-fontes-botao${selecionadas.length || fixas ? ' com-fontes' : ''}`} popoverTarget={id} aria-expanded={aberto} onClick={e => posicionar(e.currentTarget)}><Database size={16} /><span>Fontes de dados</span>{fixas ? <LockKeyhole size={13} /> : <ChevronDown size={14} />}</button>
    <div id={id} ref={painel} popover="auto" className="chat-fontes-popover" onToggle={e => { setAberto(e.newState === 'open'); if (e.newState === 'closed') setBusca(''); }}>
      <div className="chat-fontes-heading"><h2>{fixas ? 'Fontes desta conversa' : 'Escolha suas fontes'}</h2><p>{fixas ? 'As fontes ficam fixas. Crie uma nova conversa para escolher outras.' : contexto === 'busca' ? 'Selecione os conteúdos que delimitam os documentos pesquisados.' : 'Selecione os conteúdos que vão orientar as respostas.'}</p></div>
      {(fixas ?? fontes).length > 4 && <div className="chat-busca"><Search size={15} /><input type="search" aria-label="Buscar fontes" placeholder="Buscar fonte" value={busca} onChange={e => setBusca(e.target.value)} /></div>}
      <fieldset disabled={desabilitado || !!fixas}><legend className="chat-sr-only">Fontes de dados</legend>{itens.map(f => <label key={f.id}><input type="checkbox" checked={!!fixas || selecionadas.includes(f.id)} onChange={e => aoMudar(e.target.checked ? [...selecionadas, f.id] : selecionadas.filter(fid => fid !== f.id))} /><Database size={17} aria-hidden="true" /><span>{f.nome}</span></label>)}</fieldset>
      {!itens.length && <p className="chat-fontes-vazio">{busca ? 'Nenhuma fonte encontrada.' : 'Você ainda não tem fontes de dados.'}</p>}
      {!fontes.length && !fixas && <Link to="/fontes-de-dados">Cadastrar fonte de dados</Link>}
      {!fixas && fontes.length > 0 && <div className="chat-fontes-rodape"><span>{selecionadas.length} selecionada{selecionadas.length !== 1 ? 's' : ''}</span><button type="button" popoverTarget={id} popoverTargetAction="hide">Concluir</button></div>}
    </div>
  </>;
}
