import { useEffect, useRef, useState } from 'react';
import { Database, FileText, Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { useFontesDadosStore } from '../store/useFontesDadosStore';
import type { FonteDados } from '../store/useGerenciamentoStore';
import { EditorCadastro } from '../components/gerenciamento/EditorCadastro';
import { ConfirmarExclusao } from '../components/gerenciamento/ConfirmarExclusao';
import { ModalIndexacao } from '../components/gerenciamento/ModalIndexacao';
import { ModalDocumentos } from '../components/gerenciamento/ModalDocumentos';

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function FontesDados() {
  const tokenAcesso = useAutenticacaoStore(s => s.tokenAcesso);
  return tokenAcesso ? <GerenciarFontes key={tokenAcesso} tokenAcesso={tokenAcesso} /> : (
    <div className="gestao-page"><h1>Fontes de Dados</h1><p>Entre na sua conta para criar e gerenciar fontes de dados.</p><Link className="gestao-button gestao-button-primary" to="/entrar">Entrar na conta</Link></div>
  );
}

function GerenciarFontes({ tokenAcesso }: { tokenAcesso: string }) {
  const { fontes, salvarFonte, excluirFonte, indexarArquivos, carregar, carregando, erroLeitura } = useFontesDadosStore(s => s);
  const [busca, setBusca] = useState('');
  const [editor, setEditor] = useState<FonteDados | 'nova' | null>(null);
  const [exclusao, setExclusao] = useState<FonteDados | null>(null);
  const [indexacao, setIndexacao] = useState<FonteDados | null>(null);
  const [documentos, setDocumentos] = useState<FonteDados | null>(null);
  const [mensagem, setMensagem] = useState('');
  const criar = useRef<HTMLButtonElement>(null);
  const origemEditor = useRef<HTMLButtonElement | null>(null);
  const origemIndexacao = useRef<HTMLButtonElement | null>(null);
  const origemDocumentos = useRef<HTMLButtonElement | null>(null);
  const ativo = useRef(false);
  useEffect(() => { ativo.current = true; return () => { ativo.current = false; }; }, []);

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const visiveis = fontes.filter(f => `${f.nome} ${f.descricao}`.toLocaleLowerCase('pt-BR').includes(termo));
  const bloqueado = carregando || !!erroLeitura || !!editor || !!exclusao || !!indexacao || !!documentos;
  const sessaoAtual = () => ativo.current && useAutenticacaoStore.getState().tokenAcesso === tokenAcesso;

  function fecharEditor() { setEditor(null); requestAnimationFrame(() => origemEditor.current?.focus()); }
  function abrirEditor(fonte: FonteDados | 'nova', botao: HTMLButtonElement) { origemEditor.current = botao; setMensagem(''); setEditor(fonte); }

  async function salvar(dados: { nome: string; descricao: string }) {
    if (!editor) return;
    const registro = await salvarFonte(dados, editor === 'nova' ? undefined : editor.id);
    if (!registro || !sessaoAtual()) return;
    setMensagem(`Fonte “${registro.nome}” ${editor === 'nova' ? 'criada' : 'atualizada'}.`);
    setBusca('');
    fecharEditor();
  }

  async function excluir() {
    if (!exclusao) return;
    const confirmada = await excluirFonte(exclusao.id);
    if (!confirmada || !sessaoAtual()) return;
    setMensagem(`Fonte “${exclusao.nome}” excluída.`);
    setExclusao(null);
    requestAnimationFrame(() => criar.current?.focus());
  }

  return (
    <div className="gestao-page">
      <div className="gestao-page-heading"><div><h1>Fontes de Dados</h1><p>Organize o conhecimento da sua conta por assunto.</p></div><button ref={criar} className="gestao-button gestao-button-primary" disabled={bloqueado} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={18} aria-hidden="true" />Nova fonte</button></div>
      <p className="gestao-context">Uma fonte reúne informações de um mesmo contexto, como RH ou documentação técnica.</p>
      <div className="gestao-feedback" role="status" aria-live="polite">{mensagem}</div>
      <div className={`gestao-workspace${editor ? ' gestao-workspace-editing' : ''}`}>
        <section className="gestao-list gestao-sources-list" aria-label="Fontes de dados cadastradas" aria-busy={carregando}>
          <div className="gestao-toolbar"><h2>Suas fontes <span>{carregando || erroLeitura ? '—' : fontes.length}</span></h2><div className="gestao-search"><Search size={17} aria-hidden="true" /><input aria-label="Buscar fontes de dados" placeholder="Buscar fontes" value={busca} disabled={carregando || !!erroLeitura} onChange={e => setBusca(e.target.value)} type="search" /></div></div>
          {carregando ? <p className="gestao-empty-message" role="status">Carregando suas fontes…</p> : erroLeitura ? (
            <div className="gestao-empty"><h3>Não foi possível carregar suas fontes</h3><p role="alert">{erroLeitura}</p><button className="gestao-button" onClick={() => void carregar()}>Tentar novamente</button></div>
          ) : !fontes.length ? (
            <div className="gestao-empty"><Database size={32} strokeWidth={1.5} aria-hidden="true" /><h3>Seu conhecimento começa com uma fonte</h3><p>Dê um nome ao conjunto de informações que você quer organizar.</p><button className="gestao-button" disabled={bloqueado} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={17} aria-hidden="true" />Criar primeira fonte</button></div>
          ) : !visiveis.length ? (
            <div className="gestao-empty"><Search size={28} aria-hidden="true" /><h3>Nenhuma fonte encontrada</h3><p>Tente outro nome ou palavra da descrição.</p><button className="gestao-button" onClick={() => setBusca('')}>Limpar busca</button></div>
          ) : (
            <ul className="gestao-source-grid">{visiveis.map(fonte => (
              <li key={fonte.id} className="gestao-source-card">
                <div className="gestao-source-content">
                  <div className="gestao-source-header">
                    <div className="gestao-source-heading">
                      <Database size={21} aria-hidden="true" />
                      <h3>{fonte.nome}</h3>
                    </div>
                    <div className="gestao-source-management">
                      <button className="gestao-icon-button" disabled={bloqueado} aria-label={`Editar fonte ${fonte.nome}`} onClick={e => abrirEditor(fonte, e.currentTarget)}><Pencil size={17} aria-hidden="true" /></button>
                      <button className="gestao-icon-button gestao-delete" disabled={bloqueado} aria-label={`Excluir fonte ${fonte.nome}`} onClick={() => { setMensagem(''); setExclusao(fonte); }}><Trash2 size={17} aria-hidden="true" /></button>
                    </div>
                  </div>
                  <p className={`gestao-source-description${!fonte.descricao ? ' gestao-no-description' : ''}`}>{fonte.descricao || 'Sem descrição'}</p>
                </div>
                <span className="gestao-source-meta">Fonte criada em <time dateTime={fonte.criadoEm}>{data.format(new Date(fonte.criadoEm))}</time></span>
                <div className="gestao-source-footer">
                  <div className="gestao-source-file-actions">
                    <button className="gestao-button gestao-index-button" title="Indexar documentos" disabled={bloqueado} aria-label={`Indexar documentos na fonte ${fonte.nome}`} onClick={e => { origemIndexacao.current = e.currentTarget; setIndexacao(fonte); }}><UploadCloud size={16} aria-hidden="true" /><span>Indexar documentos</span></button>
                    <button type="button" className="gestao-button gestao-documents-trigger" title="Ver arquivos indexados" disabled={bloqueado} aria-label={`Ver arquivos indexados na fonte ${fonte.nome}`} onClick={e => { origemDocumentos.current = e.currentTarget; setDocumentos(fonte); }}><FileText size={16} aria-hidden="true" /><span>Ver arquivos indexados</span></button>
                  </div>
                </div>
              </li>
            ))}</ul>
          )}
        </section>
        {editor && <EditorCadastro key={editor === 'nova' ? 'nova' : editor.id} titulo={editor === 'nova' ? 'Nova fonte de dados' : 'Editar fonte de dados'} ajuda="Escolha um nome que ajude a reconhecer o conteúdo desta fonte." comDescricao limiteNome={100} limiteDescricao={250} nomeInicial={editor === 'nova' ? '' : editor.nome} descricaoInicial={editor === 'nova' ? '' : editor.descricao} acao={editor === 'nova' ? 'Criar fonte' : 'Salvar alterações'} aoFechar={fecharEditor} aoSalvar={salvar} />}
      </div>
      {exclusao && <ConfirmarExclusao tipo="fonte" nome={exclusao.nome} aoCancelar={() => setExclusao(null)} aoConfirmar={excluir} />}
      {indexacao && <ModalIndexacao fonte={indexacao} aoIndexar={indexarArquivos} aoFechar={() => { setIndexacao(null); requestAnimationFrame(() => origemIndexacao.current?.focus()); }} />}
      {documentos && <ModalDocumentos fonte={documentos} aoFechar={() => { setDocumentos(null); requestAnimationFrame(() => origemDocumentos.current?.focus()); }} />}
    </div>
  );
}
