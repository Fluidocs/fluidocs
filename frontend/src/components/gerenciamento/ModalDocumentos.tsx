import { useEffect, useId, useRef, useState } from 'react';
import { FileText, X } from 'lucide-react';
import type { FonteDados } from '../../store/useGerenciamentoStore';
import { api, extrairMensagemErro, type DocumentoFonte } from '../../services/api';
import { useAutenticacaoStore } from '../../store/useAutenticacaoStore';

interface Props {
  fonte: FonteDados;
  aoFechar: () => void;
}

export function ModalDocumentos({ fonte, aoFechar }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);
  const cancelar = useRef<HTMLButtonElement>(null);
  const origemConfirmacao = useRef<HTMLButtonElement | null>(null);
  const ativo = useRef(false);
  const enviando = useRef(false);
  const tituloId = useId();
  const descricaoId = useId();
  const confirmacaoId = useId();
  const tokenAcesso = useAutenticacaoStore(s => s.tokenAcesso);
  const [documentos, setDocumentos] = useState<DocumentoFonte[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLeitura, setErroLeitura] = useState('');
  const [atualizacao, setAtualizacao] = useState(0);
  const [selecionado, setSelecionado] = useState<DocumentoFonte | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');
  const [mensagem, setMensagem] = useState('');
  const sessaoAtual = () => ativo.current && useAutenticacaoStore.getState().tokenAcesso === tokenAcesso;

  useEffect(() => {
    const elemento = dialogo.current;
    ativo.current = true;
    elemento?.showModal();
    return () => { ativo.current = false; elemento?.close(); };
  }, []);

  useEffect(() => {
    let cancelado = false;
    const leituraAtual = () => !cancelado && useAutenticacaoStore.getState().tokenAcesso === tokenAcesso;
    setCarregando(true);
    setErroLeitura('');
    api.listarDocumentosFonte(Number(fonte.id))
      .then(lista => { if (leituraAtual()) setDocumentos(lista); })
      .catch(erro => {
        if (leituraAtual()) setErroLeitura(extrairMensagemErro(erro, 'Não foi possível carregar os arquivos. Tente novamente.'));
      })
      .finally(() => { if (leituraAtual()) setCarregando(false); });
    return () => { cancelado = true; };
  }, [fonte.id, tokenAcesso, atualizacao]);

  useEffect(() => {
    if (selecionado) cancelar.current?.focus();
    else if (origemConfirmacao.current) {
      if (origemConfirmacao.current.isConnected) origemConfirmacao.current.focus();
      else fechar.current?.focus();
    }
  }, [selecionado]);

  function cancelarDesindexacao() {
    setSelecionado(null);
    setErroExclusao('');
  }

  async function desindexar() {
    if (!selecionado || enviando.current || !sessaoAtual()) return;
    enviando.current = true;
    setProcessando(true);
    setErroExclusao('');
    setMensagem('');
    try {
      await api.desindexarDocumento(Number(fonte.id), selecionado.uuid);
      if (!sessaoAtual()) return;
      setDocumentos(anteriores => anteriores.filter(item => item.uuid !== selecionado.uuid));
      setMensagem(`Arquivo “${selecionado.nome_documento}” desindexado.`);
      setSelecionado(null);
    } catch (erro) {
      if (sessaoAtual()) setErroExclusao(extrairMensagemErro(erro, 'Não foi possível desindexar o arquivo. Tente novamente.'));
    } finally {
      enviando.current = false;
      if (sessaoAtual()) setProcessando(false);
    }
  }

  return (
    <dialog ref={dialogo} className="gestao-dialog gestao-documents-dialog" aria-labelledby={tituloId} aria-describedby={descricaoId} onCancel={evento => { evento.preventDefault(); if (enviando.current) return; if (selecionado) cancelarDesindexacao(); else aoFechar(); }}>
      <div className="gestao-index-header">
        <div>
          <h2 id={tituloId}>Arquivos indexados</h2>
          <p id={descricaoId}>Fonte: <strong>{fonte.nome}</strong>{!carregando && !erroLeitura && <> · {documentos.length} {documentos.length === 1 ? 'arquivo' : 'arquivos'}</>}</p>
        </div>
        <button ref={fechar} type="button" className="gestao-icon-button" aria-label="Fechar arquivos indexados" disabled={processando} onClick={aoFechar}><X size={20} /></button>
      </div>
      <div className="gestao-documents-body" aria-busy={carregando}>
        {carregando ? <p className="gestao-empty-message" role="status">Carregando arquivos indexados…</p> : erroLeitura ? (
          <div className="gestao-empty"><h3>Não foi possível carregar os arquivos</h3><p role="alert">{erroLeitura}</p><button type="button" className="gestao-button" onClick={() => setAtualizacao(valor => valor + 1)}>Tentar novamente</button></div>
        ) : !documentos.length ? (
          <div className="gestao-empty"><FileText size={28} aria-hidden="true" /><h3>Nenhum arquivo indexado</h3><p>Os arquivos aparecerão aqui quando a indexação desta fonte for concluída.</p></div>
        ) : (
          <ul className="gestao-documents-list" aria-label="Arquivos indexados nesta fonte">
            {documentos.map(documento => <li key={documento.uuid}>
              <FileText size={18} aria-hidden="true" />
              <span>{documento.nome_documento}</span>
              <button type="button" className="gestao-button gestao-document-remove" disabled={!!selecionado || processando} aria-label={`Desindexar ${documento.nome_documento}`} onClick={evento => { origemConfirmacao.current = evento.currentTarget; setMensagem(''); setErroExclusao(''); setSelecionado(documento); }}>Desindexar</button>
            </li>)}
          </ul>
        )}
      </div>
      {selecionado && <section className="gestao-documents-confirm" aria-labelledby={confirmacaoId} aria-busy={processando}>
        <h3 id={confirmacaoId}>Desindexar “{selecionado.nome_documento}”?</h3>
        <p>Os trechos deste arquivo serão removidos das buscas desta fonte. Para consultá-lo novamente, será necessário indexá-lo outra vez.</p>
        {erroExclusao && <p className="gestao-error" role="alert">{erroExclusao}</p>}
        <div className="gestao-form-actions"><button ref={cancelar} type="button" className="gestao-button" disabled={processando} onClick={cancelarDesindexacao}>Cancelar</button><button type="button" className="gestao-button gestao-button-danger" disabled={processando} onClick={() => void desindexar()}>{processando ? 'Desindexando…' : 'Confirmar desindexação'}</button></div>
      </section>}
      <div className="gestao-documents-feedback" role="status" aria-live="polite">{processando ? 'Desindexando arquivo. Aguarde a confirmação…' : mensagem}</div>
      <div className="gestao-form-actions gestao-documents-footer"><button type="button" className="gestao-button" disabled={carregando || !!selecionado || processando} onClick={() => { setMensagem(''); setAtualizacao(valor => valor + 1); }}>Atualizar lista</button><button type="button" className="gestao-button" disabled={processando} onClick={aoFechar}>Fechar</button></div>
    </dialog>
  );
}
