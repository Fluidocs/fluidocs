import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowUp,
  Database,
  FileSearch,
  FileText,
  LayoutGrid,
  LoaderCircle,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
} from 'lucide-react';
import { useAutenticacaoStore, type Usuario } from '../store/useAutenticacaoStore';
import { identificarConta } from '../store/useGerenciamentoStore';
import { useFontesConsumoStore } from '../store/useFontesDadosStore';
import { useBuscaStore } from '../store/useBuscaStore';
import { validarFontes, validarPergunta } from '../services/consumoDemo';
import { FontesChat } from '../components/chat/FontesChat';
import { AlternarTema } from '../components/AlternarTema';
import { TrechosResultadoBusca } from '../components/consumo/TrechosResultadoBusca';
import logo from '../assets/acme-logo.svg';
import '../components/chat/Chat.css';
import './Busca.css';

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
      <Link to="/hub" className="chat-brand" aria-label="Acme — escolher módulo">
        <img src={logo} alt="" />
        <span>Acme</span>
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
      <span>Busca nos seus arquivos</span>
      <p>Consulte os documentos indexados nas fontes de dados da sua conta.</p>
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
  const { fontes, erroLeitura: erroFontes, carregando, carregar } = useFontesConsumoStore(s => s);
  const minhas = fontes.filter(f => f.conta === conta);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [termo, setTermo] = useState('');
  const [pesquisaIniciada, setPesquisaIniciada] = useState(false);
  const { pesquisa, pesquisando, erro: erroPesquisa, pesquisar: buscarDocumentos, limpar } = useBuscaStore(s => s);
  const [erro, setErro] = useState('');
  const [mobile, setMobile] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  const [navegacaoAberta, setNavegacaoAberta] = useState(() => !window.matchMedia('(max-width: 760px)').matches);
  const campo = useRef<HTMLInputElement>(null);
  const navegacaoBotao = useRef<HTMLButtonElement>(null);
  const idsValidos = selecionadas.filter(id => minhas.some(f => f.id === id));

  useEffect(() => {
    setSelecionadas(ids => ids.filter(id => fontes.some(f => f.id === id && f.conta === conta)));
    limpar();
  }, [fontes, conta, limpar]);

  useEffect(() => () => limpar(), [limpar]);

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
    if (erroFontes || carregando || pesquisando) return;
    try {
      const consulta = validarPergunta(termo);
      const escopo = validarFontes(conta, fontes, selecionadas);
      setPesquisaIniciada(true);
      void buscarDocumentos(consulta, escopo);
      setErro('');
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível pesquisar. Tente novamente.');
    }
  }

  function definirExemplo(exemplo: string) {
    setTermo(exemplo);
    limpar();
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
          <span className="chat-header-nome">Acme<span>Busca</span></span>
        </div>
        {pesquisa && <span className="busca-header-meta" role="status">{pesquisa.total} documento{pesquisa.total === 1 ? '' : 's'} encontrado{pesquisa.total === 1 ? '' : 's'}</span>}
      </header>

      {erroFontes && <div className="chat-alerta" role="alert">{erroFontes}<button onClick={carregar}>Recarregar fontes</button></div>}
      {carregando && <p className="chat-alerta" role="status">Carregando suas fontes…</p>}

      <div className={`busca-corpo${pesquisaIniciada ? ' busca-com-resultados' : ' busca-inicial'}`}>
        {!pesquisaIniciada && <div className="busca-boas-vindas">
          <h1>Encontre o trecho certo<br />nos seus documentos.</h1>
          <p>Escolha as fontes, descreva o que procura e confira a origem de cada resultado.</p>
        </div>}

        <div className="busca-area-consulta">
          <form className="busca-compositor" onSubmit={pesquisar}>
            <label htmlFor="consulta" className="chat-sr-only">O que você está procurando?</label>
            <input ref={campo} id="consulta" type="search" maxLength={2000} value={termo} onChange={e => setTermo(e.target.value)} placeholder="O que você quer encontrar?" required disabled={pesquisando} aria-describedby="busca-ajuda" />
            <div className="chat-compositor-ferramentas">
              <FontesChat fontes={minhas} selecionadas={idsValidos} aoMudar={ids => { setSelecionadas(ids); limpar(); setErro(''); }} desabilitado={!!erroFontes || carregando || pesquisando} contexto="busca" />
              <span id="busca-ajuda" className="chat-dica-envio">{idsValidos.length ? `${idsValidos.length} fonte${idsValidos.length > 1 ? 's' : ''} selecionada${idsValidos.length > 1 ? 's' : ''}` : 'Escolha o contexto'}</span>
              <button className="chat-enviar" title="Pesquisar documentos" aria-label="Pesquisar documentos" disabled={!idsValidos.length || !termo.trim() || !!erroFontes || carregando || pesquisando}><ArrowUp size={20} /></button>
            </div>
          </form>
          {(erro || erroPesquisa) && <p role="alert" className="chat-alerta">{erro || erroPesquisa}</p>}
          {pesquisando && <p role="status" className="busca-pesquisando"><LoaderCircle size={18} aria-hidden="true" /><span>pesquisando</span></p>}
          {!pesquisaIniciada && <div className="chat-sugestoes" aria-label="Sugestões de consulta">
            {['Benefícios para novos talentos', 'Padrões de revisão de código', 'Como publicar uma nova versão'].map(exemplo => <button key={exemplo} onClick={() => definirExemplo(exemplo)}>{exemplo}</button>)}
          </div>}
          <p className="chat-rodape">A busca consulta os documentos indexados nas fontes selecionadas.</p>
        </div>

        {pesquisa && <section className="busca-resultados" aria-labelledby="resultados-titulo" aria-busy={pesquisando}>
          <div className="busca-resultados-cabecalho">
            <div>
              <h1 id="resultados-titulo">Resultados para “{pesquisa.termo}”</h1>
              <p>Trechos mais relacionados dentro das fontes que você selecionou.</p>
            </div>
            <button className="busca-nova-consulta" onClick={() => { setTermo(''); limpar(); setPesquisaIniciada(false); setErro(''); requestAnimationFrame(() => campo.current?.focus()); }}><Search size={16} />Nova consulta</button>
          </div>

          {pesquisa.resultados.length ? <div className="busca-lista">
            {pesquisa.resultados.map(documento => <article className="busca-resultado" key={`${documento.fonte_dados_id}:${documento.documento_id}`}>
              <div className="busca-resultado-topo">
                <span className="busca-resultado-icone" aria-hidden="true"><FileText size={21} strokeWidth={1.7} /></span>
                <div className="busca-resultado-identidade">
                  <h2>{documento.nome_documento}</h2>
                </div>
                <span className="busca-resultado-tipo">{documento.nome_documento.includes('.') ? documento.nome_documento.split('.').pop()?.toUpperCase() : 'ARQUIVO'}</span>
              </div>
              <TrechosResultadoBusca trechos={documento.trechos} />
              <footer className="busca-resultado-meta">
                <span><Database size={14} aria-hidden="true" />{pesquisa.fontes.find(f => Number(f.id) === documento.fonte_dados_id)?.nome ?? 'Fonte indisponível'}</span>
              </footer>
            </article>)}
          </div> : <div className="busca-sem-resultados">
            <FileSearch size={30} strokeWidth={1.5} aria-hidden="true" />
            <h2>Nenhum documento encontrado</h2>
            <p>Tente outros termos ou ajuste as fontes selecionadas. Confira se seus arquivos já foram indexados.</p>
            <button className="chat-primary" onClick={() => { limpar(); requestAnimationFrame(() => campo.current?.focus()); }}>Editar consulta</button>
          </div>}
          {pesquisa.paginas_totais > 1 && <nav className="busca-resultados-cabecalho" aria-label="Páginas de resultados">
            <button className="busca-nova-consulta" disabled={pesquisando || pesquisa.pagina <= 1} onClick={() => void buscarDocumentos(pesquisa.termo, pesquisa.fontes, pesquisa.pagina - 1)}>Página anterior</button>
            <span role="status">Página {pesquisa.pagina} de {pesquisa.paginas_totais}</span>
            <button className="busca-nova-consulta" disabled={pesquisando || pesquisa.pagina >= pesquisa.paginas_totais} onClick={() => void buscarDocumentos(pesquisa.termo, pesquisa.fontes, pesquisa.pagina + 1)}>Próxima página</button>
          </nav>}
        </section>}
      </div>
    </main>
  </div>;
}
