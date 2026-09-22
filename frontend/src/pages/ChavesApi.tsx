import { useEffect, useRef, useState } from 'react';
import { Check, Copy, KeyRound, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta, useGerenciamentoStore, type ChaveApi } from '../store/useGerenciamentoStore';
import { EditorCadastro } from '../components/gerenciamento/EditorCadastro';
import { ConfirmarExclusao } from '../components/gerenciamento/ConfirmarExclusao';

const data = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

function ChaveCriada({ nome, valor, aoFechar }: { nome: string; valor: string; aoFechar: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const [copiada, setCopiada] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => { titulo.current?.focus(); }, []);
  return <section className="gestao-editor gestao-secret" aria-labelledby="chave-criada-titulo"><div className="gestao-editor-title"><h2 ref={titulo} tabIndex={-1} id="chave-criada-titulo">Chave criada</h2><button className="gestao-icon-button" aria-label="Fechar chave criada" onClick={aoFechar}><X size={20} /></button></div><p className="gestao-muted">Copie a chave de <strong>{nome}</strong> agora. O valor completo não será exibido novamente.</p><label htmlFor="chave-valor">Chave de demonstração</label><textarea id="chave-valor" className="gestao-token" value={valor} readOnly rows={3} spellCheck={false} onFocus={e => e.target.select()} /><button className="gestao-button" onClick={async () => { try { await navigator.clipboard.writeText(valor); setCopiada(true); setErro(''); } catch { setErro('Não foi possível copiar automaticamente. Selecione o valor acima e copie manualmente.'); } }}>{copiada ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copiada ? 'Chave copiada' : 'Copiar chave'}</button><p className="gestao-secret-note">Esta chave é fictícia e não autentica requisições à API.</p><p role="status" className={erro ? 'gestao-error' : 'gestao-feedback'}>{erro || (copiada ? 'Chave copiada para a área de transferência.' : '')}</p><button className="gestao-button gestao-button-primary" onClick={aoFechar}>Concluir</button></section>;
}

export function ChavesApi() {
  const usuario = useAutenticacaoStore(s => s.usuario)!;
  const conta = identificarConta(usuario);
  const { chaves, criarChave, renomearChave, excluirChave, erroLeitura } = useGerenciamentoStore(s => s);
  const [busca, setBusca] = useState('');
  const [editor, setEditor] = useState<ChaveApi | 'nova' | null>(null);
  const [criada, setCriada] = useState<{ nome: string; valor: string } | null>(null);
  const [exclusao, setExclusao] = useState<ChaveApi | null>(null);
  const [mensagem, setMensagem] = useState('');
  const criar = useRef<HTMLButtonElement>(null);
  const origemEditor = useRef<HTMLButtonElement | null>(null);
  const minhas = chaves.filter(c => c.conta === conta);
  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const visiveis = minhas.filter(c => c.nome.toLocaleLowerCase('pt-BR').includes(termo));
  const ocupado = !!editor || !!criada;
  function fecharEditor() { setEditor(null); requestAnimationFrame(() => origemEditor.current?.focus()); }
  function abrirEditor(chave: ChaveApi | 'nova', botao: HTMLButtonElement) { origemEditor.current = botao; setMensagem(''); setEditor(chave); }

  return (
    <div className="gestao-page">
      <div className="gestao-page-heading"><div><h1>Chaves de API</h1><p>Identifique as chaves usadas pelas suas integrações.</p></div><button ref={criar} className="gestao-button gestao-button-primary" disabled={!!erroLeitura || ocupado} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={18} aria-hidden="true" />Nova chave</button></div>
      <p className="gestao-context">Experimente criar e gerenciar chaves fictícias. Elas ficam vinculadas à sua conta neste navegador e não permitem acesso à API.</p>
      <div className="gestao-feedback" role="status" aria-live="polite">{mensagem}</div>
      <div className={`gestao-workspace${ocupado ? ' gestao-workspace-editing' : ''}`}>
        <section className="gestao-list" aria-label="Chaves de API cadastradas">
          <div className="gestao-toolbar"><h2>Suas chaves <span>{minhas.length}</span></h2><div className="gestao-search"><Search size={17} aria-hidden="true" /><input aria-label="Buscar chaves de API" placeholder="Buscar chaves" value={busca} onChange={e => setBusca(e.target.value)} type="search" /></div></div>
          {erroLeitura ? <p className="gestao-empty-message">A lista ficará disponível quando os dados locais forem carregados.</p> : !minhas.length ? <div className="gestao-empty"><KeyRound size={32} strokeWidth={1.5} aria-hidden="true" /><h3>Uma chave para cada integração</h3><p>Crie uma chave de demonstração para conhecer o fluxo. O valor completo aparece somente uma vez.</p><button className="gestao-button" disabled={ocupado} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={17} aria-hidden="true" />Criar primeira chave</button></div> : !visiveis.length ? <div className="gestao-empty"><Search size={28} aria-hidden="true" /><h3>Nenhuma chave encontrada</h3><p>Tente buscar por outro nome.</p><button className="gestao-button" onClick={() => setBusca('')}>Limpar busca</button></div> : <ul className="gestao-records">{visiveis.map(chave => <li key={chave.id} className="gestao-record"><KeyRound className="gestao-record-icon" size={21} aria-hidden="true" /><div className="gestao-record-content"><h3>{chave.nome}</h3><code className="gestao-key-mask" aria-label={`Chave de demonstração terminada em ${chave.final}`}>fd_demo_••••••••{chave.final}</code><span className="gestao-record-meta">Criada em <time dateTime={chave.criadoEm}>{data.format(new Date(chave.criadoEm))}</time></span></div><div className="gestao-record-actions"><button className="gestao-icon-button" disabled={ocupado} aria-label={`Renomear chave ${chave.nome}`} onClick={e => abrirEditor(chave, e.currentTarget)}><Pencil size={17} /></button><button className="gestao-icon-button gestao-delete" disabled={ocupado} aria-label={`Excluir chave ${chave.nome}`} onClick={() => setExclusao(chave)}><Trash2 size={17} /></button></div></li>)}</ul>}
        </section>
        {editor && <EditorCadastro key={editor === 'nova' ? 'nova' : editor.id} titulo={editor === 'nova' ? 'Nova chave de API' : 'Renomear chave de API'} ajuda={editor === 'nova' ? 'Dê um nome à integração para reconhecer esta chave depois.' : 'A alteração do nome preserva a identificação desta chave.'} nomeInicial={editor === 'nova' ? '' : editor.nome} acao={editor === 'nova' ? 'Criar chave' : 'Salvar nome'} aoFechar={fecharEditor} aoSalvar={({ nome }) => { if (editor === 'nova') { const resultado = criarChave(conta, nome); setCriada({ nome: resultado.registro.nome, valor: resultado.valor }); setEditor(null); setMensagem('Chave de demonstração criada. Copie o valor antes de concluir.'); } else { renomearChave(conta, editor.id, nome); setMensagem('Nome da chave atualizado.'); fecharEditor(); } setBusca(''); }} />}
        {criada && <ChaveCriada nome={criada.nome} valor={criada.valor} aoFechar={() => { setCriada(null); setMensagem('Chave cadastrada. Apenas sua identificação permanece salva.'); requestAnimationFrame(() => criar.current?.focus()); }} />}
      </div>
      {exclusao && <ConfirmarExclusao tipo="chave" nome={exclusao.nome} aoCancelar={() => setExclusao(null)} aoConfirmar={() => { excluirChave(conta, exclusao.id); setMensagem(`Chave “${exclusao.nome}” excluída.`); setExclusao(null); criar.current?.focus(); }} />}
    </div>
  );
}
