import { useEffect, useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { extrairMensagemErro } from '../../services/api';

interface Props {
  titulo: string;
  ajuda: string;
  nomeInicial?: string;
  descricaoInicial?: string;
  comDescricao?: boolean;
  limiteNome?: number;
  limiteDescricao?: number;
  placeholderNome?: string;
  placeholderDescricao?: string;
  acao: string;
  aoSalvar: (dados: { nome: string; descricao: string }) => void | Promise<void>;
  aoFechar: () => void;
}

export function EditorCadastro({ titulo, ajuda, nomeInicial = '', descricaoInicial = '', comDescricao = false, limiteNome = 80, limiteDescricao = 240, placeholderNome, placeholderDescricao = 'Descreva quais informações esta fonte vai reunir.', acao, aoSalvar, aoFechar }: Props) {
  const [nome, setNome] = useState(nomeInicial);
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);
  const enviando = useRef(false);
  const campo = useRef<HTMLInputElement>(null);
  useEffect(() => { campo.current?.focus(); }, []);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();
    if (enviando.current) return;
    enviando.current = true;
    setSalvando(true);
    setErro('');
    try { await aoSalvar({ nome, descricao }); }
    catch (e) { setErro(extrairMensagemErro(e, 'Não foi possível salvar. Tente novamente.')); }
    finally { enviando.current = false; setSalvando(false); }
  }

  return (
    <section className="gestao-editor" aria-labelledby="editor-titulo">
      <div className="gestao-editor-title"><h2 id="editor-titulo">{titulo}</h2><button className="gestao-icon-button" disabled={salvando} onClick={aoFechar} aria-label="Fechar formulário"><X size={20} /></button></div>
      <p className="gestao-muted">{ajuda}</p>
      <form onSubmit={salvar} aria-busy={salvando}>
        <div className="gestao-field"><label htmlFor="cadastro-nome">Nome <span>(obrigatório)</span></label><input ref={campo} id="cadastro-nome" value={nome} disabled={salvando} onChange={e => setNome(e.target.value)} required maxLength={limiteNome} autoComplete="off" placeholder={placeholderNome ?? (comDescricao ? 'Ex.: Políticas de RH' : 'Ex.: Integração do portal')} aria-describedby={erro ? 'cadastro-erro' : undefined} /></div>
        {comDescricao && <div className="gestao-field"><label htmlFor="cadastro-descricao">Descrição <span>(opcional)</span></label><textarea id="cadastro-descricao" rows={4} value={descricao} disabled={salvando} onChange={e => setDescricao(e.target.value)} maxLength={limiteDescricao} placeholder={placeholderDescricao} /><span className="gestao-field-help">{descricao.length}/{limiteDescricao} caracteres</span></div>}
        {erro && <p id="cadastro-erro" className="gestao-error" role="alert">{erro}</p>}
        <div className="gestao-form-actions"><button type="button" className="gestao-button" disabled={salvando} onClick={aoFechar}>Cancelar</button><button type="submit" className="gestao-button gestao-button-primary" disabled={salvando}>{salvando ? 'Salvando…' : acao}</button></div>
      </form>
    </section>
  );
}
