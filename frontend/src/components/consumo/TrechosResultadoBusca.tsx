import { useId, useState } from 'react';
import type { DocumentoPesquisa } from '../../services/api';

const LIMITE_PREVIA = 255;

export function TrechosResultadoBusca({ trechos }: Pick<DocumentoPesquisa, 'trechos'>) {
  const [expandido, setExpandido] = useState(false);
  const id = useId();
  const textos = trechos.flatMap(trecho => trecho.conteudo?.trim() ? [trecho.conteudo] : []);
  const caracteres = Array.from(textos.join('\n\n'));
  const podeExpandir = caracteres.length > LIMITE_PREVIA;

  if (!textos.length) return <p className="busca-resultado-trecho">Nenhum trecho disponível para este documento.</p>;

  return <>
    <div id={id}>
      {podeExpandir && !expandido
        ? <blockquote className="busca-resultado-trecho">{caracteres.slice(0, LIMITE_PREVIA).join('')}</blockquote>
        : textos.map((texto, indice) => <blockquote className="busca-resultado-trecho" key={indice}>{texto}</blockquote>)}
    </div>
    {podeExpandir && <button
      type="button"
      className="busca-resultado-expandir"
      aria-expanded={expandido}
      aria-controls={id}
      onClick={() => setExpandido(!expandido)}
    >{expandido ? 'ver menos' : 'ver mais...'}</button>}
  </>;
}
