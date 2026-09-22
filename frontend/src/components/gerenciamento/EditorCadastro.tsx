import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

interface Props {
  titulo: string;
  ajuda: string;
  nomeInicial?: string;
  descricaoInicial?: string;
  comDescricao?: boolean;
  acao: string;
  aoSalvar: (dados: { nome: string; descricao: string }) => void;
  aoFechar: () => void;
}

export function EditorCadastro({ titulo, ajuda, nomeInicial = '', descricaoInicial = '', comDescricao = false, acao, aoSalvar, aoFechar }: Props) {
  const [nome, setNome] = useState(nomeInicial);
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [erro, setErro] = useState('');
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => { campo.current?.focus(); }, []);

  function salvar(evento: FormEvent) {
    evento.preventDefault();
    setErro('');
    try { aoSalvar({ nome, descricao }); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Não foi possível salvar. Tente novamente.'); }
  }

  return (
    <section className="gestao-editor" aria-labelledby="editor-titulo">
      <div className="gestao-editor-title"><h2 id="editor-titulo">{titulo}</h2><button className="gestao-icon-button" onClick={aoFechar} aria-label="Fechar formulário"><X size={20} /></button></div>
      <p className="gestao-muted">{ajuda}</p>
      <form onSubmit={salvar}>
        <div className="gestao-field"><label htmlFor="cadastro-nome">Nome <span>(obrigatório)</span></label><input ref={campo} id="cadastro-nome" value={nome} onChange={e => setNome(e.target.value)} required maxLength={80} autoComplete="off" placeholder={comDescricao ? 'Ex.: Políticas de RH' : 'Ex.: Integração do portal'} aria-describedby={erro ? 'cadastro-erro' : undefined} /></div>
        {comDescricao && <div className="gestao-field"><label htmlFor="cadastro-descricao">Descrição <span>(opcional)</span></label><textarea id="cadastro-descricao" rows={4} value={descricao} onChange={e => setDescricao(e.target.value)} maxLength={240} placeholder="Descreva quais informações esta fonte vai reunir." /><span className="gestao-field-help">{descricao.length}/240 caracteres</span></div>}
        {erro && <p id="cadastro-erro" className="gestao-error" role="alert">{erro}</p>}
        <div className="gestao-form-actions"><button type="button" className="gestao-button" onClick={aoFechar}>Cancelar</button><button type="submit" className="gestao-button gestao-button-primary">{acao}</button></div>
      </form>
    </section>
  );
}
