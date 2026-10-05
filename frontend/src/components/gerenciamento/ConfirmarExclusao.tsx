import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { extrairMensagemErro } from '../../services/api';

interface Props {
  nome: string;
  tipo: 'fonte' | 'chave' | 'conversa';
  aoCancelar: () => void;
  aoConfirmar: () => void | Promise<void>;
}

export function ConfirmarExclusao({ nome, tipo, aoCancelar, aoConfirmar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [erro, setErro] = useState('');
  const [excluindo, setExcluindo] = useState(false);
  const enviando = useRef(false);
  useEffect(() => {
    const elemento = dialogo.current;
    const anterior = document.activeElement as HTMLElement | null;
    elemento?.showModal();
    return () => { elemento?.close(); anterior?.focus(); };
  }, []);

  async function confirmar() {
    if (enviando.current) return;
    enviando.current = true;
    setExcluindo(true);
    setErro('');
    try { await aoConfirmar(); }
    catch (e) { setErro(extrairMensagemErro(e, 'Não foi possível excluir. Tente novamente.')); }
    finally { enviando.current = false; setExcluindo(false); }
  }

  return (
    <dialog className="gestao-dialog" ref={dialogo} aria-labelledby="excluir-titulo" aria-describedby="excluir-descricao" aria-busy={excluindo} onCancel={evento => { evento.preventDefault(); if (!enviando.current) aoCancelar(); }}>
      <AlertTriangle size={25} className="gestao-danger-icon" aria-hidden="true" />
      <h2 id="excluir-titulo">Excluir {tipo === 'fonte' ? 'fonte de dados' : tipo === 'chave' ? 'chave de API' : 'conversa'}?</h2>
      <p id="excluir-descricao">O cadastro <strong>{nome}</strong> será removido. Esta ação não pode ser desfeita.</p>
      {tipo === 'conversa' && <p className="gestao-muted">As mensagens e as evidências salvas nesta conversa também serão removidas.</p>}
      {tipo === 'chave' && <p className="gestao-muted">As integrações que usam esta chave perderão o acesso à API.</p>}
      {tipo === 'fonte' && <p className="gestao-muted">Os documentos associados a esta fonte também serão removidos das buscas.</p>}
      {erro && <p className="gestao-error" role="alert">{erro}</p>}
      <div className="gestao-form-actions"><button className="gestao-button" autoFocus disabled={excluindo} onClick={aoCancelar}>Cancelar</button><button className="gestao-button gestao-button-danger" disabled={excluindo} onClick={confirmar}>{excluindo ? 'Excluindo…' : `Excluir ${tipo}`}</button></div>
    </dialog>
  );
}
