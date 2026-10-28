import { useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { Archive, Check, CircleCheck, FileText, UploadCloud, X } from 'lucide-react';
import type { FonteDados } from '../../store/useGerenciamentoStore';
import type { IndexarArquivos, ResultadoEnvioIndexacao } from '../../store/useFontesDadosStore';
import { arquivoEhZip, extrairMensagemErro, FORMATOS_INDEXACAO, validarArquivoIndexacao } from '../../services/api';

interface Props {
  fonte?: FonteDados;
  fontes?: FonteDados[];
  aoFechar: () => void;
  aoIndexar: IndexarArquivos;
}

interface ArquivoSelecionado {
  arquivo: File;
  resultado?: ResultadoEnvioIndexacao;
}

function tamanhoArquivo(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const megabytes = bytes >= 1024 * 1024;
  return `${(bytes / (megabytes ? 1024 * 1024 : 1024)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${megabytes ? 'MB' : 'KB'}`;
}

export function ModalIndexacao({ fonte, fontes = [], aoFechar, aoIndexar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const ativo = useRef(false);
  const enviando = useRef(false);
  const tituloId = useId();
  const descricaoId = useId();
  const [arquivos, setArquivos] = useState<ArquivoSelecionado[]>([]);
  const [arrastando, setArrastando] = useState(false);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState('');
  const [fonteId, setFonteId] = useState(fonte?.id ?? '');
  const fonteSelecionada = fonte ?? fontes.find(item => item.id === fonteId);
  const aceitos = arquivos.filter(item => item.resultado?.status === 'aceito').length;
  const falhas = arquivos.filter(item => item.resultado?.status === 'erro').length;
  const pendentes = arquivos.map((item, indice) => ({ ...item, indice })).filter(item => item.resultado?.status !== 'aceito');
  const envioConcluido = arquivos.length > 0 && aceitos === arquivos.length && !processando && !erro;

  useEffect(() => {
    const elemento = dialogo.current;
    ativo.current = true;
    elemento?.showModal();
    return () => { ativo.current = false; elemento?.close(); };
  }, []);

  useEffect(() => {
    if (!envioConcluido) return;
    const temporizador = window.setTimeout(aoFechar, 3000);
    return () => window.clearTimeout(temporizador);
  }, [envioConcluido, aoFechar]);

  function limpar() {
    setArquivos([]);
    setErro('');
    if (campo.current) campo.current.value = '';
  }

  function selecionar(lista: FileList | null) {
    if (enviando.current || !lista?.length) return;
    const recebidos = Array.from(lista);
    limpar();
    try {
      recebidos.forEach(validarArquivoIndexacao);
      setArquivos(recebidos.map(arquivo => ({ arquivo })));
    } catch (e) {
      setErro(extrairMensagemErro(e, 'Não foi possível selecionar os arquivos.'));
    }
  }

  function soltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    selecionar(evento.dataTransfer.files);
  }

  async function indexar() {
    if (enviando.current || !pendentes.length || !fonteSelecionada) return;
    enviando.current = true;
    setErro('');
    setProcessando(true);
    try {
      await aoIndexar(fonteSelecionada.id, pendentes.map(item => item.arquivo), (indice, resultado) => {
        if (!ativo.current) return;
        const original = pendentes[indice].indice;
        setArquivos(anteriores => anteriores.map((item, posicao) => posicao === original ? { ...item, resultado } : item));
      });
    } catch (e) {
      if (ativo.current) setErro(extrairMensagemErro(e, 'Não foi possível enviar os documentos. Tente novamente.'));
    } finally {
      enviando.current = false;
      if (ativo.current) setProcessando(false);
    }
  }

  return (
    <dialog ref={dialogo} className={`gestao-dialog gestao-index-dialog${envioConcluido ? ' gestao-index-dialog-complete' : ''}`} aria-labelledby={tituloId} aria-describedby={envioConcluido ? undefined : descricaoId} onCancel={evento => { evento.preventDefault(); if (!enviando.current) aoFechar(); }}>
      {envioConcluido ? <div className="gestao-index-confirmation" role="status" aria-live="polite">
        <CircleCheck size={48} strokeWidth={1.6} aria-hidden="true" />
        <p id={tituloId}>{arquivos.length === 1 ? 'arquivo enviado para a fila de processamento!' : 'arquivos enviados para a fila de processamento!'}</p>
      </div> : <>
      <div className="gestao-index-header">
        <div><h2 id={tituloId}>Indexar documentos</h2><p id={descricaoId}>{fonte ? <>Adicione conteúdo à fonte <strong>{fonte.nome}</strong>.</> : 'Escolha a fonte de dados que receberá os documentos.'}</p></div>
        <button className="gestao-icon-button" aria-label="Fechar indexação" disabled={processando} onClick={aoFechar}><X size={20} /></button>
      </div>

      {!fonte && <div className="gestao-index-source"><label htmlFor={`${tituloId}-fonte`}>Fonte de dados</label><select id={`${tituloId}-fonte`} value={fonteId} onChange={evento => { setFonteId(evento.target.value); limpar(); }} disabled={processando || aceitos > 0}><option value="">Selecione uma fonte</option>{fontes.map(item => <option key={item.id} value={item.id}>{item.nome}</option>)}</select>{!fontes.length && <p>Crie uma fonte de dados antes de indexar documentos.</p>}</div>}
      <div className={`gestao-dropzone${arquivos.length ? ' has-selection' : ''}${arrastando ? ' is-dragging' : ''}`} onDragEnter={evento => { evento.preventDefault(); if (!enviando.current) setArrastando(true); }} onDragOver={evento => evento.preventDefault()} onDragLeave={() => setArrastando(false)} onDrop={soltar}>
        <UploadCloud size={30} strokeWidth={1.6} aria-hidden="true" />
        <strong>Arraste os arquivos para cá</strong>
        <span>ou escolha no seu dispositivo</span>
        <button type="button" className="gestao-button" disabled={processando} onClick={() => campo.current?.click()}>{aceitos ? 'Escolher novos arquivos' : 'Escolher arquivos'}</button>
        <input ref={campo} className="gestao-file-input" aria-label="Arquivos para indexação" type="file" multiple accept={FORMATOS_INDEXACAO.map(formato => `.${formato}`).join(',')} disabled={processando} onChange={evento => selecionar(evento.target.files)} />
      </div>
      <p className="gestao-index-formats">PDF, TXT, PNG, JPG e JPEG. Para enviar um lote, use um ZIP com esses formatos, sem senha.</p>

      {arquivos.length > 0 && <section className="gestao-index-selection" aria-label="Arquivos selecionados" aria-busy={processando}>
        <div><strong>{arquivos.length} {arquivos.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}</strong><button type="button" disabled={processando} onClick={limpar}>Limpar seleção</button></div>
        <ul>{arquivos.map(({ arquivo, resultado }, indice) => <li key={indice}>
          <span className="gestao-file-kind" aria-hidden="true">{arquivoEhZip(arquivo) ? <Archive size={16} /> : <FileText size={16} />}</span>
          <div className="gestao-file-content"><span>{arquivo.name}</span>
            <span className={`gestao-file-status${resultado?.status === 'erro' ? ' gestao-file-error' : ''}${resultado?.status === 'aceito' ? ' gestao-file-accepted' : ''}`}>
              {!resultado ? 'Pronto para enviar' : resultado.status === 'enviando' ? 'Enviando…' : resultado.status === 'erro' ? resultado.mensagem : <>Enviado para processamento{'quantidade_arquivos' in resultado.resposta ? ` · ${resultado.resposta.quantidade_arquivos} documentos no ZIP` : ''}</>}
            </span>
          </div>
          <small>{tamanhoArquivo(arquivo.size)}</small>
        </li>)}</ul>
      </section>}
      <div className="gestao-index-feedback" role="status" aria-live="polite">
        {processando ? 'Enviando arquivos. Aguarde a confirmação de cada envio…' : falhas > 0 ? `${falhas} ${falhas === 1 ? 'envio falhou' : 'envios falharam'}. Tente reenviar os arquivos com erro.` : ''}
      </div>
      {aceitos > 0 && <div className="gestao-index-success" role="status"><Check size={18} aria-hidden="true" /><p><strong>{aceitos} {aceitos === 1 ? 'arquivo enviado' : 'arquivos enviados'} para processamento.</strong><span>A indexação ocorre em segundo plano. A confirmação de envio ainda não indica que os documentos estão disponíveis para busca.</span></p></div>}
      {erro && <p className="gestao-error" role="alert">{erro}</p>}

      <div className="gestao-form-actions"><button type="button" className="gestao-button" disabled={processando} onClick={aoFechar}>{aceitos ? 'Fechar' : 'Cancelar'}</button><button type="button" className="gestao-button gestao-button-primary" disabled={!fonteSelecionada || !pendentes.length || processando} onClick={() => void indexar()}>{processando ? 'Enviando…' : `${falhas ? 'Reenviar' : 'Indexar'}${pendentes.length ? ` ${pendentes.length}` : ''}`}</button></div>
      </>}
    </dialog>
  );
}
