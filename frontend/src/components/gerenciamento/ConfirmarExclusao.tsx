import { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  nome: string;
  tipo: 'fonte' | 'chave' | 'conversa';
  aoCancelar: () => void;
  aoConfirmar: () => void;
}

export function ConfirmarExclusao({ nome, tipo, aoCancelar, aoConfirmar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [erro, setErro] = useState('');
  useEffect(() => {
    const elemento = dialogo.current;
    const anterior = document.activeElement as HTMLElement | null;
    elemento?.showModal();
    return () => { elemento?.close(); anterior?.focus(); };
  }, []);

  return (
    <dialog className="gestao-dialog" ref={dialogo} aria-labelledby="excluir-titulo" aria-describedby="excluir-descricao" onCancel={aoCancelar}>
      <AlertTriangle size={25} className="gestao-danger-icon" aria-hidden="true" />
      <h2 id="excluir-titulo">Excluir {tipo === 'fonte' ? 'fonte de dados' : tipo === 'chave' ? 'chave de API' : 'conversa'}?</h2>
      <p id="excluir-descricao">O cadastro <strong>{nome}</strong> será removido. Esta ação não pode ser desfeita.</p>
      {tipo === 'conversa' && <p className="gestao-muted">As mensagens e as evidências salvas nesta conversa também serão removidas.</p>}
      {erro && <p className="gestao-error" role="alert">{erro}</p>}
      <div className="gestao-form-actions"><button className="gestao-button" autoFocus onClick={aoCancelar}>Cancelar</button><button className="gestao-button gestao-button-danger" onClick={() => { try { aoConfirmar(); } catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível excluir. Tente novamente.'); } }}>Excluir {tipo}</button></div>
    </dialog>
  );
}
