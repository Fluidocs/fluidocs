import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUp,
  CalendarDays,
  Database,
  FileSearch,
  FileText,
  LayoutGrid,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react';
import { useAutenticacaoStore, type Usuario } from '../store/useAutenticacaoStore';
import { identificarConta } from '../store/useGerenciamentoStore';
import { useFontesDadosStore } from '../store/useFontesDadosStore';
import { pesquisarExemplos, validarFontes, validarPergunta, type DocumentoDemo } from '../services/consumoDemo';
import { FontesChat } from '../components/chat/FontesChat';
import { AlternarTema } from '../components/AlternarTema';
import logo from '../assets/prisma-norte-logo.svg';
import '../components/chat/Chat.css';

const formatarData = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

function BarraLateralBusca({ aberto, mobile, usuario, aoFechar, aoSair }: {
  aberto: boolean;
  mobile: boolean;
  usuario: Usuario;
  aoFechar: () => void;
  aoSair: () => void;
}) {
  const dialogo = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const elemento = dialogo.current;
    if (mobile && aberto) elemento?.showModal();
    else elemento?.close();
    return () => elemento?.close();
  }, [mobile, aberto]);

  const conteudo = <>
    <div className="chat-sidebar-topo">
      <Link to="/hub" className="chat-brand" aria-label="Prisma Norte — escolher módulo">
        <img src={logo} alt="" />
        <span>Prisma Norte</span>
      </Link>
      <button className="chat-icon" aria-label="Recolher navegação" onClick={aoFechar}><PanelLeftClose size={19} /></button>
    </div>
    <nav className="chat-nav busca-nav" aria-label="Busca e conversas">
      <Link to="/busca" className="selecionada" aria-current="page"><Search size={17} />Buscar documentos</Link>
      <Link to="/conversas"><MessageSquare size={17} />Conversas</Link>
    </nav>
    <div className="busca-sidebar-contexto">
      <Database size={20} aria-hidden="true" />
      <div>
        <strong>Consulte com contexto</strong>
        <p>Escolha uma ou mais fontes antes de pesquisar. Os resultados ficam limitados ao conteúdo selecionado.</p>
      </div>
    </div>
    <div className="busca-sidebar-nota">
      <span>Demonstração local</span>
      <p>Os resultados simulam documentos internos da Prisma Norte. Nenhum arquivo real é consultado.</p>
    </div>
    <div className="chat-sidebar-base">
      <Link to="/hub"><LayoutGrid size={17} />Trocar módulo</Link>
      <div className="chat-conta">
        <span className="chat-avatar" aria-hidden="true">{usuario.nome.trim().slice(0, 1).toUpperCase()}</span>
        <span className="chat-conta-nome">{usuario.nome}<small>Busca e conversas</small></span>
        <AlternarTema />
        <button className="chat-icon" title="Sair" aria-label="Sair" onClick={aoSair}><LogOut size={17} /></button>
      </div>
    </div>
  </>;

  if (mobile) return <dialog ref={dialogo} id="busca-sidebar" className="chat-sidebar chat-sidebar-dialog" aria-label="Navegação da busca" onCancel={e => { e.preventDefault(); aoFechar(); }} onClick={e => {
    if (e.target !== e.currentTarget) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (e.clientX > r.right || e.clientY > r.bottom) aoFechar();
  }}>{conteudo}</dialog>;

  return <aside id="busca-sidebar" className="chat-sidebar" hidden={!aberto} aria-label="Navegação da busca">{conteudo}</aside>;
}

export function Busca() {
  const usuario = useAutenticacaoStore(s => s.usuario)!;
  const sair = useAutenticacaoStore(s => s.sair);
  const conta = identificarConta(usuario);
  const { fontes, erroLeitura: erroFontes, carregando, carregar } = useFontesDadosStore(s => s);
  const minhas = fontes.filter(f => f.conta === conta);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [termo, setTermo] = useState('');
  const [pesquisa, setPesquisa] = useState<{ termo: string; resultados: DocumentoDemo[] } | null>(null);
  const [erro, setErro] = useState('');
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [navegacaoAberta, setNavegacaoAberta] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  const campo = useRef<HTMLInputElement>(null);
  const navegacaoBotao = useRef<HTMLButtonElement>(null);
  const idsValidos = selecionadas.filter(id => minhas.some(f => f.id === id));

  useEffect(() => {
    setSelecionadas(ids => ids.filter(id => fontes.some(f => f.id === id && f.conta === conta)));
    setPesquisa(null);
  }, [fontes, conta]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const adaptar = () => { setMobile(media.matches); setNavegacaoAberta(!media.matches); };
    media.addEventListener('change', adaptar);
    return () => media.removeEventListener('change', adaptar);
  }, []);

  function fecharNavegacao() {
    setNavegacaoAberta(false);
    requestAnimationFrame(() => navegacaoBotao.current?.focus());
  }

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    if (erroFontes || carregando) return;
    try {
      const consulta = validarPergunta(termo);
      const escopo = validarFontes(conta, fontes, selecionadas);
      setPesquisa({ termo: consulta, resultados: pesquisarExemplos(consulta, escopo) });
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível pesquisar. Tente novamente.');
    }
  }

  function definirExemplo(exemplo: string) {
    setTermo(exemplo);
    setPesquisa(null);
    setErro('');
    requestAnimationFrame(() => campo.current?.focus());
  }

  return <div className={`chat-app busca-app${navegacaoAberta && !mobile ? ' chat-com-sidebar' : ''}`}>
    <a className="chat-skip" href="#busca-conteudo">Pular para a busca</a>
    <BarraLateralBusca aberto={navegacaoAberta} mobile={mobile} usuario={usuario} aoFechar={fecharNavegacao} aoSair={sair} />
    <main id="busca-conteudo" className="chat-main" tabIndex={-1}>
      <header className="chat-header busca-header">
        <div className="chat-header-inicio">
          <button ref={navegacaoBotao} className="chat-icon" aria-label={navegacaoAberta ? 'Recolher navegação' : 'Abrir navegação'} aria-expanded={navegacaoAberta} aria-controls="busca-sidebar" onClick={() => setNavegacaoAberta(!navegacaoAberta)}><PanelLeftOpen size={20} /></button>
          <span className="chat-header-nome">Prisma Norte<span>Busca</span></span>
        </div>
        {pesquisa && <span className="busca-header-meta" role="status">{pesquisa.resultados.length} documento{pesquisa.resultados.length === 1 ? '' : 's'} encontrado{pesquisa.resultados.length === 1 ? '' : 's'}</span>}
      </header>

      {erroFontes && <div className="chat-alerta" role="alert">{erroFontes}<button onClick={carregar}>Recarregar fontes</button></div>}
      {carregando && <p className="chat-alerta" role="status">Carregando suas fontes…</p>}

      <div className={`busca-corpo${pesquisa ? ' busca-com-resultados' : ' busca-inicial'}`}>
        {!pesquisa && <div className="busca-boas-vindas">
          <h1>Encontre o trecho certo<br />nos seus documentos.</h1>
          <p>Escolha as fontes, descreva o que procura e confira a origem de cada resultado.</p>
        </div>}

        <div className="busca-area-consulta">
          <form className="busca-compositor" onSubmit={pesquisar}>
            <label htmlFor="consulta" className="chat-sr-only">O que você está procurando?</label>
            <input ref={campo} id="consulta" type="search" maxLength={2000} value={termo} onChange={e => setTermo(e.target.value)} placeholder="O que você quer encontrar?" required aria-describedby="busca-ajuda" />
            <div className="chat-compositor-ferramentas">
              <FontesChat fontes={minhas} selecionadas={idsValidos} aoMudar={ids => { setSelecionadas(ids); setPesquisa(null); setErro(''); }} desabilitado={!!erroFontes || carregando} contexto="busca" />
              <span id="busca-ajuda" className="chat-dica-envio">{idsValidos.length ? `${idsValidos.length} fonte${idsValidos.length > 1 ? 's' : ''} selecionada${idsValidos.length > 1 ? 's' : ''}` : 'Escolha o contexto'}</span>
              <button className="chat-enviar" title="Pesquisar documentos" aria-label="Pesquisar documentos" disabled={!idsValidos.length || !termo.trim() || !!erroFontes || carregando}><ArrowUp size={20} /></button>
            </div>
          </form>
          {erro && <p role="alert" className="chat-alerta">{erro}</p>}
          {!pesquisa && <div className="chat-sugestoes" aria-label="Sugestões de consulta">
            {['Benefícios para novos talentos', 'Padrões de revisão de código', 'Como publicar uma nova versão'].map(exemplo => <button key={exemplo} onClick={() => definirExemplo(exemplo)}>{exemplo}</button>)}
          </div>}
          <p className="chat-rodape">Os resultados desta demonstração são fictícios e ficam limitados às fontes selecionadas.</p>
        </div>

        {pesquisa && <section className="busca-resultados" aria-labelledby="resultados-titulo">
          <div className="busca-resultados-cabecalho">
            <div>
              <h1 id="resultados-titulo">Resultados para “{pesquisa.termo}”</h1>
              <p>Trechos mais relacionados dentro das fontes que você selecionou.</p>
            </div>
            <button className="busca-nova-consulta" onClick={() => { setTermo(''); setPesquisa(null); setErro(''); requestAnimationFrame(() => campo.current?.focus()); }}><Search size={16} />Nova consulta</button>
          </div>

          {pesquisa.resultados.length ? <div className="busca-lista">
            {pesquisa.resultados.map(documento => <article className="busca-resultado" key={documento.id}>
              <div className="busca-resultado-topo">
                <span className="busca-resultado-icone" aria-hidden="true"><FileText size={21} strokeWidth={1.7} /></span>
                <div className="busca-resultado-identidade">
                  <h2>{documento.nome}</h2>
                  <p>{documento.titulo}</p>
                </div>
                <span className="busca-resultado-tipo">{documento.tipo}</span>
              </div>
              <blockquote className="busca-resultado-trecho">{documento.trecho.length > 260 ? `${documento.trecho.slice(0, 260)}…` : documento.trecho}</blockquote>
              <footer className="busca-resultado-meta">
                <span><CalendarDays size={14} aria-hidden="true" />Indexado em <time dateTime={documento.indexadoEm}>{formatarData.format(new Date(documento.indexadoEm))}</time></span>
                <span><Database size={14} aria-hidden="true" />{documento.fonteNome}</span>
                <span>Texto de exemplo</span>
              </footer>
            </article>)}
          </div> : <div className="busca-sem-resultados">
            <FileSearch size={30} strokeWidth={1.5} aria-hidden="true" />
            <h2>Nenhum documento encontrado</h2>
            <p>Tente pesquisar sobre onboarding, benefícios, desenvolvimento ou deploy, ou ajuste as fontes selecionadas.</p>
            <button className="chat-primary" onClick={() => { setPesquisa(null); requestAnimationFrame(() => campo.current?.focus()); }}>Editar consulta</button>
          </div>}
        </section>}
      </div>
    </main>
  </div>;
}
