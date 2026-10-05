import { useEffect, useRef, useState } from 'react';
import { Check, Copy, KeyRound, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { api, extrairMensagemErro, type ChaveApiBackend } from '../services/api';
import { EditorCadastro } from '../components/gerenciamento/EditorCadastro';
import { ConfirmarExclusao } from '../components/gerenciamento/ConfirmarExclusao';

function ChaveCriada({ nome, valor, aoFechar }: { nome: string; valor: string; aoFechar: () => void }) {
  const titulo = useRef<HTMLHeadingElement>(null);
  const [copiada, setCopiada] = useState(false);
  const [erro, setErro] = useState('');
  useEffect(() => { titulo.current?.focus(); }, []);
  return <section className="gestao-editor gestao-secret" aria-labelledby="chave-criada-titulo"><div className="gestao-editor-title"><h2 ref={titulo} tabIndex={-1} id="chave-criada-titulo">Chave criada</h2><button className="gestao-icon-button" aria-label="Fechar chave criada" onClick={aoFechar}><X size={20} /></button></div><p className="gestao-muted">Copie a chave de <strong>{nome}</strong> agora. O valor completo não será exibido novamente.</p><label htmlFor="chave-valor">Valor da chave</label><textarea id="chave-valor" className="gestao-token" value={valor} readOnly rows={3} spellCheck={false} onFocus={e => e.target.select()} /><button className="gestao-button" onClick={async () => { try { await navigator.clipboard.writeText(valor); setCopiada(true); setErro(''); } catch { setErro('Não foi possível copiar automaticamente. Selecione o valor acima e copie manualmente.'); } }}>{copiada ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}{copiada ? 'Chave copiada' : 'Copiar chave'}</button><p role="status" className={erro ? 'gestao-error' : 'gestao-feedback'}>{erro || (copiada ? 'Chave copiada para a área de transferência.' : '')}</p><button className="gestao-button gestao-button-primary" onClick={aoFechar}>Concluir</button></section>;
}

export function ChavesApi() {
  const tokenAcesso = useAutenticacaoStore(s => s.tokenAcesso);
  // Uma nova sessão descarta a lista e qualquer segredo ainda exibido.
  return tokenAcesso ? <GerenciarChaves key={tokenAcesso} tokenAcesso={tokenAcesso} /> : null;
}

function GerenciarChaves({ tokenAcesso }: { tokenAcesso: string }) {
  const [chaves, setChaves] = useState<ChaveApiBackend[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroLeitura, setErroLeitura] = useState('');
  const [tentativa, setTentativa] = useState(0);
  const [busca, setBusca] = useState('');
  const [editor, setEditor] = useState<ChaveApiBackend | 'nova' | null>(null);
  const [criada, setCriada] = useState<{ nome: string; valor: string } | null>(null);
  const [exclusao, setExclusao] = useState<ChaveApiBackend | null>(null);
  const [mensagem, setMensagem] = useState('');
  const criar = useRef<HTMLButtonElement>(null);
  const origemEditor = useRef<HTMLButtonElement | null>(null);
  const ativo = useRef(false);

  useEffect(() => {
    ativo.current = true;
    return () => { ativo.current = false; };
  }, []);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErroLeitura('');
    api.listarChavesApi()
      .then(resultado => { if (!cancelado) setChaves(resultado); })
      .catch(erro => {
        if (!cancelado) setErroLeitura(extrairMensagemErro(erro, 'Não foi possível carregar suas chaves. Tente novamente.'));
      })
      .finally(() => { if (!cancelado) setCarregando(false); });
    return () => { cancelado = true; };
  }, [tentativa]);

  function sessaoAtual() {
    return ativo.current && useAutenticacaoStore.getState().tokenAcesso === tokenAcesso;
  }

  const termo = busca.trim().toLocaleLowerCase('pt-BR');
  const visiveis = chaves.filter(c => c.nome.toLocaleLowerCase('pt-BR').includes(termo));
  const ocupado = !!editor || !!criada;
  const bloqueado = ocupado || !!exclusao || carregando || !!erroLeitura;
  function fecharEditor() { setEditor(null); requestAnimationFrame(() => origemEditor.current?.focus()); }
  function abrirEditor(chave: ChaveApiBackend | 'nova', botao: HTMLButtonElement) { origemEditor.current = botao; setMensagem(''); setEditor(chave); }

  async function salvar({ nome, descricao }: { nome: string; descricao: string }) {
    if (editor === 'nova') {
      const resultado = await api.criarChaveApi({ nome, descricao });
      if (!sessaoAtual()) return;
      const { token, ...registro } = resultado;
      setChaves(anteriores => [...anteriores, registro]);
      setCriada({ nome: registro.nome, valor: token });
      setEditor(null);
      setMensagem('Chave criada. Copie o valor antes de concluir.');
    } else if (editor) {
      const resultado = await api.renomearChaveApi(editor.id, nome);
      if (!sessaoAtual()) return;
      setChaves(anteriores => anteriores.map(chave => chave.id === resultado.id ? resultado : chave));
      setMensagem('Nome da chave atualizado.');
      fecharEditor();
    }
    setBusca('');
  }

  async function excluir() {
    if (!exclusao) return;
    await api.excluirChaveApi(exclusao.id);
    if (!sessaoAtual()) return;
    setChaves(anteriores => anteriores.filter(chave => chave.id !== exclusao.id));
    setMensagem(`Chave “${exclusao.nome}” excluída.`);
    setExclusao(null);
    requestAnimationFrame(() => criar.current?.focus());
  }

  return (
    <div className="gestao-page">
      <div className="gestao-page-heading"><div><h1>Chaves de API</h1><p>Identifique as chaves usadas pelas suas integrações.</p></div><button ref={criar} className="gestao-button gestao-button-primary" disabled={bloqueado} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={18} aria-hidden="true" />Nova chave</button></div>
      <p className="gestao-context">Crie e gerencie as chaves associadas à sua conta.</p>
      <div className="gestao-feedback" role="status" aria-live="polite">{mensagem}</div>
      <div className={`gestao-workspace${ocupado ? ' gestao-workspace-editing' : ''}`}>
        <section className="gestao-list" aria-label="Chaves de API cadastradas" aria-busy={carregando}>
          <div className="gestao-toolbar"><h2>Suas chaves <span>{carregando || erroLeitura ? '—' : chaves.length}</span></h2><div className="gestao-search"><Search size={17} aria-hidden="true" /><input aria-label="Buscar chaves de API" placeholder="Buscar chaves" value={busca} disabled={carregando || !!erroLeitura} onChange={e => setBusca(e.target.value)} type="search" /></div></div>
          {carregando ? <p className="gestao-empty-message" role="status">Carregando suas chaves…</p> : erroLeitura ? (
            <div className="gestao-empty"><h3>Não foi possível carregar suas chaves</h3><p role="alert">{erroLeitura}</p><button className="gestao-button" onClick={() => setTentativa(valor => valor + 1)}>Tentar novamente</button></div>
          ) : !chaves.length ? (
            <div className="gestao-empty"><KeyRound size={32} strokeWidth={1.5} aria-hidden="true" /><h3>Uma chave para cada integração</h3><p>Crie uma chave para identificar sua integração. O valor completo aparece somente uma vez.</p><button className="gestao-button" disabled={bloqueado} onClick={e => abrirEditor('nova', e.currentTarget)}><Plus size={17} aria-hidden="true" />Criar primeira chave</button></div>
          ) : !visiveis.length ? (
            <div className="gestao-empty"><Search size={28} aria-hidden="true" /><h3>Nenhuma chave encontrada</h3><p>Tente buscar por outro nome.</p><button className="gestao-button" onClick={() => setBusca('')}>Limpar busca</button></div>
          ) : (
            <ul className="gestao-records">{visiveis.map(chave => (
              <li key={chave.id} className="gestao-record">
                <KeyRound className="gestao-record-icon" size={21} aria-hidden="true" />
                <div className="gestao-record-content"><h3>{chave.nome}</h3>{chave.descricao && <p>{chave.descricao}</p>}<span className="gestao-record-meta">Identificação: {chave.id}</span></div>
                <div className="gestao-record-actions"><button className="gestao-icon-button" disabled={bloqueado} aria-label={`Renomear chave ${chave.nome}`} onClick={e => abrirEditor(chave, e.currentTarget)}><Pencil size={17} /></button><button className="gestao-icon-button gestao-delete" disabled={bloqueado} aria-label={`Excluir chave ${chave.nome}`} onClick={() => { setMensagem(''); setExclusao(chave); }}><Trash2 size={17} /></button></div>
              </li>
            ))}</ul>
          )}
        </section>
        {editor && <EditorCadastro key={editor === 'nova' ? 'nova' : editor.id} titulo={editor === 'nova' ? 'Nova chave de API' : 'Renomear chave de API'} ajuda={editor === 'nova' ? 'Dê um nome à integração para reconhecer esta chave depois.' : 'A alteração do nome preserva a identificação desta chave.'} nomeInicial={editor === 'nova' ? '' : editor.nome} limiteNome={60} limiteDescricao={255} comDescricao={editor === 'nova'} placeholderNome="Ex.: Integração do portal" placeholderDescricao="Ex.: Acesso usado pelo portal interno." acao={editor === 'nova' ? 'Criar chave' : 'Salvar nome'} aoFechar={fecharEditor} aoSalvar={salvar} />}
        {criada && <ChaveCriada nome={criada.nome} valor={criada.valor} aoFechar={() => { setCriada(null); setMensagem('Chave cadastrada. Apenas sua identificação permanece salva.'); requestAnimationFrame(() => criar.current?.focus()); }} />}
      </div>
      {exclusao && <ConfirmarExclusao tipo="chave" nome={exclusao.nome} aoCancelar={() => setExclusao(null)} aoConfirmar={excluir} />}
    </div>
  );
}
