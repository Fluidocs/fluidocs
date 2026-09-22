import { Link } from 'react-router-dom';
import { Database, ArrowUpRight } from 'lucide-react';
import type { FonteDados } from '../../store/useGerenciamentoStore';

interface Props {
  fontes: FonteDados[];
  selecionadas: string[];
  aoMudar: (ids: string[]) => void;
  desabilitado?: boolean;
}
export function SeletorFontes({ fontes, selecionadas, aoMudar, desabilitado }: Props) {
  return <fieldset className="consumo-fontes" disabled={desabilitado}>
    <legend><Database size={17} aria-hidden="true" />Fontes de dados <span>{selecionadas.length} selecionada{selecionadas.length === 1 ? '' : 's'}</span></legend>
    {!fontes.length ? <div className="consumo-sem-fontes"><p>Você ainda não tem fontes cadastradas. Crie uma no módulo de gerenciamento para experimentar a busca e as conversas.</p><Link className="consumo-link" to="/fontes-de-dados">Ir para gerenciamento<ArrowUpRight size={15} aria-hidden="true" /></Link></div> : <>
      <p className="consumo-hint">Selecione uma ou mais fontes para delimitar a consulta.</p>
      <div className="consumo-fontes-opcoes">{fontes.map(f => <label key={f.id} className={selecionadas.includes(f.id) ? 'selecionada' : ''}><input type="checkbox" checked={selecionadas.includes(f.id)} onChange={e => aoMudar(e.target.checked ? [...selecionadas, f.id] : selecionadas.filter(id => id !== f.id))} /><span>{f.nome}</span></label>)}</div>
    </>}
  </fieldset>;
}
