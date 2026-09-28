import { useEffect, useId, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import type { FonteDados } from '../../store/useGerenciamentoStore';

interface Props {
  fonte: FonteDados;
  aoFechar: () => void;
}

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function ModalDocumentos({ fonte, aoFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const tituloId = useId();
  const descricaoId = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    elemento?.showModal();
    return () => elemento?.close();
  }, []);

  return (
    <dialog ref={dialogo} className="gestao-dialog gestao-documents-dialog" aria-labelledby={tituloId} aria-describedby={descricaoId} onCancel={evento => { evento.preventDefault(); aoFechar(); }}>
      <div className="gestao-index-header">
        <div>
          <h2 id={tituloId}>Documentos indexados</h2>
          <p id={descricaoId}>Fonte: <strong>{fonte.nome}</strong> · {fonte.documentos.length} {fonte.documentos.length === 1 ? 'documento' : 'documentos'}</p>
        </div>
        <button type="button" className="gestao-icon-button" aria-label="Fechar documentos indexados" onClick={aoFechar}><X size={20} /></button>
      </div>
      <ul className="gestao-documents-list">
        {fonte.documentos.map(documento => <li key={documento.id}>
          <FileText size={18} aria-hidden="true" />
          <span>{documento.nome}</span>
          <time dateTime={documento.indexadoEm}>{data.format(new Date(documento.indexadoEm))}</time>
        </li>)}
      </ul>
    </dialog>
  );
}
