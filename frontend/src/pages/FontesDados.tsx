import { useRef, useState } from 'react';
import { Database, FileText, Pencil, Plus, Search, Trash2, UploadCloud } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta, useGerenciamentoStore, type FonteDados } from '../store/useGerenciamentoStore';
import { EditorCadastro } from '../components/gerenciamento/EditorCadastro';
import { ConfirmarExclusao } from '../components/gerenciamento/ConfirmarExclusao';
import { ModalIndexacao } from '../components/gerenciamento/ModalIndexacao';
import { ModalDocumentos } from '../components/gerenciamento/ModalDocumentos';

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export function FontesDados() {
  const usuario = useAutenticacaoStore(s => s.usuario)!;
  const conta = identificarConta(usuario);
  const { fontes, salvarFonte, excluirFonte, registrarDocumentos, erroLeitura } = useGerenciamentoStore(s => s);
  const [busca, setBusca] = useState('');
  const [editor, setEditor] = useState<FonteDados | 'nova' | null>(null);
  const [exclusao, setExclusao] = useState<FonteDados | null>(null);
  const [indexacao, setIndexacao] = useState<FonteDados | null>(null);
  const [documentos, setDocumentos] = useState<FonteDados | null>(null);
  const [mensagem, setMensagem] = useState('');
  const criar = useRef<HTMLButtonElement>(null);
  const origemEditor = useRef<HTMLButtonElement | null>(null);
  const origemDocumentos = useRef<HTMLButtonElement | null>(null);
  const minhas = fontes.filter(f => f.conta === conta);
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const visiveis = minhas.filter(f => `${f.nome} ${f.descricao}`.toLocaleLowerCase('pt-BR').includes(termo));

  function fecharEditor() { setEditor(null); requestAnimationFrame(() => origemEditor.current?.focus()); }
  function abrirEditor(fonte: FonteDados | 'nova', botao: HTMLButtonElement) { origemEditor.current = botao; setMensagem(''); setEditor(fonte); }
  function fecharDocumentos() { setDocumentos(null); requestAnimationFrame(() => origemDocumentos.current?.focus()); }

  return (
    <div className="gestao-page">
      <div className="gestao-page-heading"><div><h1>Fontes de Dados</h1><p>Organize o conhecimento da sua conta por assunto.</p></div><button ref={criar} className="gestao-button gestao-button-primary" disabled={!!erroLeitura || !!editor} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={18} aria-hidden="true" />Nova fonte</button></div>
      <p className="gestao-context">Uma fonte reúne informações de um mesmo contexto, como RH ou documentação técnica. Adicione documentos para preparar o conteúdo que será consultado nas buscas e conversas.</p>
      <div className="gestao-feedback" role="status" aria-live="polite">{mensagem}</div>
      <div className={`gestao-workspace${editor ? ' gestao-workspace-editing' : ''}`}>
        <section className="gestao-list" aria-label="Fontes de dados cadastradas">
          <div className="gestao-toolbar"><h2>Suas fontes <span>{minhas.length}</span></h2><div className="gestao-search"><Search size={17} aria-hidden="true" /><input aria-label="Buscar fontes de dados" placeholder="Buscar fontes" value={busca} onChange={e => setBusca(e.target.value)} type="search" /></div></div>
          {erroLeitura ? <p className="gestao-empty-message">Não foi possível carregar suas fontes. Tente novamente.</p> : !minhas.length ? <div className="gestao-empty"><Database size={32} strokeWidth={1.5} aria-hidden="true" /><h3>Seu conhecimento começa com uma fonte</h3><p>Dê um nome ao conjunto de informações que você quer organizar.</p><button className="gestao-button" disabled={!!editor} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={17} aria-hidden="true" />Criar primeira fonte</button></div> : !visiveis.length ? <div className="gestao-empty"><Search size={28} aria-hidden="true" /><h3>Nenhuma fonte encontrada</h3><p>Tente outro nome ou palavra da descrição.</p><button className="gestao-button" onClick={() => setBusca('')}>Limpar busca</button></div> : <ul className="gestao-records">{visiveis.map(fonte => <li key={fonte.id} className="gestao-record"><Database className="gestao-record-icon" size={21} aria-hidden="true" /><div className="gestao-record-content"><h3>{fonte.nome}</h3><p className={!fonte.descricao ? 'gestao-no-description' : ''}>{fonte.descricao || 'Sem descrição'}</p>{fonte.documentos.length ? <button type="button" className="gestao-documents-trigger" disabled={!!editor} onClick={e => { origemDocumentos.current = e.currentTarget; setDocumentos(fonte); }}><FileText size={14} aria-hidden="true" />Ver {fonte.documentos.length} {fonte.documentos.length === 1 ? 'documento indexado' : 'documentos indexados'}</button> : <span className="gestao-record-meta">Nenhum documento indexado</span>}<span className="gestao-record-meta">Fonte criada em <time dateTime={fonte.criadoEm}>{data.format(new Date(fonte.criadoEm))}</time></span></div><div className="gestao-record-actions gestao-source-actions"><button className="gestao-button gestao-index-button" disabled={!!editor} onClick={() => setIndexacao(fonte)}><UploadCloud size={16} aria-hidden="true" />Indexar documentos</button><button className="gestao-icon-button" disabled={!!editor} aria-label={`Editar fonte ${fonte.nome}`} onClick={e => abrirEditor(fonte, e.currentTarget)}><Pencil size={17} /></button><button className="gestao-icon-button gestao-delete" disabled={!!editor} aria-label={`Excluir fonte ${fonte.nome}`} onClick={() => setExclusao(fonte)}><Trash2 size={17} /></button></div></li>)}</ul>}
        </section>
        {editor && <EditorCadastro key={editor === 'nova' ? 'nova' : editor.id} titulo={editor === 'nova' ? 'Nova fonte de dados' : 'Editar fonte de dados'} ajuda="Escolha um nome que ajude a reconhecer o conteúdo desta fonte." comDescricao nomeInicial={editor === 'nova' ? '' : editor.nome} descricaoInicial={editor === 'nova' ? '' : editor.descricao} acao={editor === 'nova' ? 'Criar fonte' : 'Salvar alterações'} aoFechar={fecharEditor} aoSalvar={dados => { const registro = salvarFonte(conta, dados, editor === 'nova' ? undefined : editor.id); setMensagem(`Fonte “${registro.nome}” ${editor === 'nova' ? 'criada' : 'atualizada'}.`); setBusca(''); fecharEditor(); }} />}
      </div>
      {exclusao && <ConfirmarExclusao tipo="fonte" nome={exclusao.nome} aoCancelar={() => setExclusao(null)} aoConfirmar={() => { excluirFonte(conta, exclusao.id); setMensagem(`Fonte “${exclusao.nome}” excluída.`); setExclusao(null); criar.current?.focus(); }} />}
      {indexacao && <ModalIndexacao fonte={fontes.find(fonte => fonte.id === indexacao.id) ?? indexacao} aoFechar={() => setIndexacao(null)} aoIndexar={(fonteId, nomes) => registrarDocumentos(conta, fonteId, nomes)} />}
      {documentos && <ModalDocumentos fonte={fontes.find(fonte => fonte.id === documentos.id) ?? documentos} aoFechar={fecharDocumentos} />}
    </div>
  );
}
