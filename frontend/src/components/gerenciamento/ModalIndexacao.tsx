import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Archive, Check, FileText, UploadCloud, X } from 'lucide-react';
import type { DocumentoIndexado, FonteDados } from '../../store/useGerenciamentoStore';

const EXTENSOES = ['xls', 'xlsx', 'doc', 'docx', 'ppt', 'pptx', 'pdf', 'txt', 'zip', 'rar'];
const ACCEPT = EXTENSOES.map(extensao => `.${extensao}`).join(',');

interface Props {
  fonte: FonteDados;
  aoFechar: () => void;
  aoIndexar: (nomes: string[]) => DocumentoIndexado[];
}

function extensao(nome: string) {
  return nome.includes('.') ? nome.split('.').pop()?.toLocaleLowerCase('pt-BR') ?? '' : '';
}

export function ModalIndexacao({ fonte, aoFechar, aoIndexar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const tituloId = useId();
  const descricaoId = useId();
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [concluidos, setConcluidos] = useState<string[]>([]);

  useEffect(() => {
    const elemento = dialogo.current;
    elemento?.showModal();
    return () => elemento?.close();
  }, []);

  function selecionar(lista: FileList | null) {
    if (!lista) return;
    setErro('');
    setConcluidos([]);
    const recebidos = Array.from(lista);
    const invalidos = recebidos.filter(arquivo => !EXTENSOES.includes(extensao(arquivo.name)));
    if (invalidos.length) {
      setErro(`${invalidos.length === 1 ? 'Este arquivo não é compatível' : 'Alguns arquivos não são compatíveis'}: ${invalidos.map(arquivo => arquivo.name).join(', ')}.`);
      return;
    }
    setArquivos(recebidos);
  }

  function soltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    selecionar(evento.dataTransfer.files);
  }

  async function indexar() {
    if (!arquivos.length) return;
    setErro('');
    setProcessando(true);
    await new Promise(resolve => window.setTimeout(resolve, 650));
    try {
      const registrados = aoIndexar(arquivos.map(arquivo => arquivo.name));
      setConcluidos(registrados.map(documento => documento.nome));
      setArquivos([]);
      if (campo.current) campo.current.value = '';
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível registrar os documentos. Tente novamente.');
    } finally {
      setProcessando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="gestao-dialog gestao-index-dialog" aria-labelledby={tituloId} aria-describedby={descricaoId} onCancel={evento => { evento.preventDefault(); if (!processando) aoFechar(); }}>
      <div className="gestao-index-header">
        <div><h2 id={tituloId}>Indexar documentos</h2><p id={descricaoId}>Adicione conteúdo à fonte <strong>{fonte.nome}</strong>.</p></div>
        <button className="gestao-icon-button" aria-label="Fechar indexação" disabled={processando} onClick={aoFechar}><X size={20} /></button>
      </div>


      <div className={`gestao-dropzone${arrastando ? ' is-dragging' : ''}`} onDragEnter={evento => { evento.preventDefault(); setArrastando(true); }} onDragOver={evento => evento.preventDefault()} onDragLeave={() => setArrastando(false)} onDrop={soltar}>
        <UploadCloud size={30} strokeWidth={1.6} aria-hidden="true" />
        <strong>Arraste os arquivos para cá</strong>
        <span>ou escolha no seu dispositivo</span>
        <button type="button" className="gestao-button" onClick={() => campo.current?.click()}>Escolher arquivos</button>
        <input ref={campo} className="gestao-file-input" type="file" multiple accept={ACCEPT} onChange={(evento: ChangeEvent<HTMLInputElement>) => selecionar(evento.target.files)} />
      </div>
      <p className="gestao-index-formats">Formatos aceitos: XLS, XLSX, DOC, DOCX, PPT, PPTX, PDF, TXT, ZIP e RAR.</p>

      {arquivos.length > 0 && <div className="gestao-index-selection"><div><strong>{arquivos.length} {arquivos.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}</strong><button type="button" onClick={() => { setArquivos([]); if (campo.current) campo.current.value = ''; }}>Limpar</button></div><ul>{arquivos.map(arquivo => <li key={`${arquivo.name}-${arquivo.lastModified}`}><span className="gestao-file-kind">{['zip', 'rar'].includes(extensao(arquivo.name)) ? <Archive size={16} /> : <FileText size={16} />}</span><span>{arquivo.name}</span><small>{(arquivo.size / 1024 / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB</small></li>)}</ul></div>}
      {concluidos.length > 0 && <div className="gestao-index-success" role="status"><Check size={18} aria-hidden="true" /><p><strong>{concluidos.length === 1 ? 'Documento adicionado' : 'Documentos adicionados'} à fonte.</strong><span>A indexação real ocorrerá em segundo plano quando a API estiver conectada.</span></p></div>}
      {erro && <p className="gestao-error" role="alert">{erro}</p>}

      <div className="gestao-form-actions"><button type="button" className="gestao-button" disabled={processando} onClick={aoFechar}>{concluidos.length ? 'Concluir' : 'Cancelar'}</button><button type="button" className="gestao-button gestao-button-primary" disabled={!arquivos.length || processando} onClick={indexar}>{processando ? 'Preparando…' : `Indexar${arquivos.length ? ` ${arquivos.length}` : ''}`}</button></div>
    </dialog>
  );
}
