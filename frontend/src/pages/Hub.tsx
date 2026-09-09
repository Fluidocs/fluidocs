import React, { useState, useRef, useEffect, useMemo, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, 
  Search, 
  Database, 
  Send, 
  Bot, 
  User, 
  Plus, 
  Trash2, 
  FileText, 
  File, 
  Image as ImageIcon, 
  Eye,
  Clock,
  Filter,
  Sparkles,
  Zap,
  ChevronRight,
  DatabaseZap,
  Compass
} from 'lucide-react';
import { useDadosStore } from '../store/useDadosStore';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { ModalArquivo } from '../components/ModalArquivo';
import { DadosArquivo } from '../tipos';
import { api, extrairMensagemErro } from '../services/api';
import { criarPreviaTexto } from '../utils/formatacaoDocumento';

type ModuloHub = 'chat' | 'search';

export function Hub() {
  const { usuario } = useAutenticacaoStore();
  const { chats, repositorios, adicionarSessaoChat, adicionarMensagemChat, removerSessaoChat } = useDadosStore();
  
  // Tab control
  const [moduloAtivo, setModuloAtivo] = useState<ModuloHub>('chat');

  // Selected Integration Repository
  const [idRepoSelecionado, setIdRepoSelecionado] = useState<string>('');

  // RAG Chat states
  const [idChatAtivo, setIdChatAtivo] = useState<string | null>(chats[0]?.id || null);
  const [entradaChat, setEntradaChat] = useState('');
  const [estaProcessandoIA, setEstaProcessandoIA] = useState(false);
  const [erroChat, setErroChat] = useState<string | null>(null);

  // Elasticsearch Search states
  const [termoBusca, setTermoBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<DadosArquivo[]>([]);
  const [totalResultados, setTotalResultados] = useState(0);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [buscaHibrida, setBuscaHibrida] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Citation attachment preview modals
  const [arquivoSelecionado, setArquivoSelecionado] = useState<DadosArquivo | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const [isPending, startTransition] = useTransition();
  const painelMensagensRef = useRef<HTMLDivElement>(null);
  const chatAtivo = chats.find(c => c.id === idChatAtivo);

  // RBAC Permission check
  const reposAcessiveis = useMemo(
    () => repositorios.filter(repo =>
      usuario?.gruposAcesso.some(grupo => repo.gruposAcesso.includes(grupo))
    ),
    [repositorios, usuario?.gruposAcesso]
  );

  useEffect(() => {
    const primeiroRepositorio = reposAcessiveis[0]?.id ?? '';

    if (!primeiroRepositorio) {
      setIdRepoSelecionado('');
      return;
    }

    if (!reposAcessiveis.some(repo => repo.id === idRepoSelecionado)) {
      setIdRepoSelecionado(primeiroRepositorio);
    }
  }, [idRepoSelecionado, reposAcessiveis]);

  const obterNomeRepositorio = (idRepositorio: string) => (
    reposAcessiveis.find(repo => repo.id === idRepositorio)?.nome ?? 'Repositorio selecionado'
  );

  const getIconeArquivo = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-500" />;
      case 'doc':
      case 'docx': return <File className="w-5 h-5 text-fluid-blue" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image': return <ImageIcon className="w-5 h-5 text-fluid-success" />;
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const rolarParaBaixo = () => {
    const painel = painelMensagensRef.current;
    if (!painel) return;

    requestAnimationFrame(() => {
      painel.scrollTo({
        top: painel.scrollHeight,
        behavior: 'smooth',
      });
    });
  };

  useEffect(() => {
    if (chats.length > 0 && !idChatAtivo) {
      setIdChatAtivo(chats[0].id);
    }
  }, [chats, idChatAtivo]);

  useEffect(() => {
    const deveRolarMensagens =
      moduloAtivo === 'chat' &&
      (estaProcessandoIA || (chatAtivo?.mensagens.length ?? 0) > 0);

    if (deveRolarMensagens) {
      rolarParaBaixo();
    }
  }, [chatAtivo?.mensagens, estaProcessandoIA, moduloAtivo]);

  const lidarEnvioChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entradaChat.trim() || estaProcessandoIA) return;

    setErroChat(null);
    let idChat = idChatAtivo;

    if (!idChat) {
      const tituloNovo = entradaChat.slice(0, 30) + (entradaChat.length > 30 ? '...' : '');
      idChat = adicionarSessaoChat(tituloNovo);
      setIdChatAtivo(idChat);
      api.criarChat(tituloNovo).catch(err => console.error(err));
    }

    const pergunta = entradaChat;
    adicionarMensagemChat(idChat, { papel: 'user', conteudo: pergunta });
    setEntradaChat('');
    setEstaProcessandoIA(true);

    startTransition(async () => {
      try {
        const repositoriosFiltro = idRepoSelecionado ? [idRepoSelecionado] : [];

        const resposta = await api.enviarMensagemChat(
          idChat!,
          pergunta,
          repositoriosFiltro
        );

        adicionarMensagemChat(idChat!, {
          papel: 'assistant',
          conteudo: resposta.conteudo,
          anexos: resposta.anexos
        });
      } catch (err) {
        console.error(err);
        setErroChat(extrairMensagemErro(err));
      } finally {
        setEstaProcessandoIA(false);
      }
    });
  };

  const lidarComBusca = (e: React.FormEvent) => {
    e.preventDefault();
    const termo = termoBusca.trim();

    if (!termo) return;

    if (!idRepoSelecionado) {
      setErroBusca('Selecione um repositorio antes de pesquisar.');
      setResultadosBusca([]);
      setTotalResultados(0);
      return;
    }

    setErroBusca(null);
    setTermoPesquisado(termo);

    startTransition(async () => {
      try {
        const dados = await api.pesquisarDocumentos(
          termo,
          1,
          10,
          buscaHibrida,
          idRepoSelecionado
        );
        setResultadosBusca(dados.resultados);
        setTotalResultados(dados.total);
      } catch (err) {
        console.error(err);
        setResultadosBusca([]);
        setTotalResultados(0);
        setErroBusca(extrairMensagemErro(err));
      }
    });
  };

  const lidarNovoChat = () => {
    setIdChatAtivo(null);
  };

  const lidarDeletarChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removerSessaoChat(id);
    if (idChatAtivo === id) setIdChatAtivo(null);
    try {
      await api.deletarChat(id);
    } catch (err) {
      console.warn(err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Module Nav Header */}
      <div className="bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/40 shadow-xl shadow-slate-100/40 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        
        {/* Toggle Hub Mode */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200/10 rounded-2xl self-start relative">
          <button
            onClick={() => setModuloAtivo('chat')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all relative z-10 cursor-pointer ${
              moduloAtivo === 'chat'
                ? 'bg-white dark:bg-slate-850 text-fluid-blue shadow-md'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4.5 h-4.5" />
            Assistente Virtual
          </button>
          <button
            onClick={() => setModuloAtivo('search')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all relative z-10 cursor-pointer ${
              moduloAtivo === 'search'
                ? 'bg-white dark:bg-slate-850 text-fluid-blue shadow-md'
                : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Search className="w-4.5 h-4.5" />
            Busca de Documentos
          </button>
        </div>

        {/* Global Repository Access Selector (RBAC-checked) */}
        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-2xl">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap flex items-center gap-1.5">
            <DatabaseZap className="w-4 h-4 text-fluid-blue animate-[pulse_3s_infinite]" />
            Repositório Ativo:
          </label>
          <div className="relative min-w-56">
            <select
              value={idRepoSelecionado}
              onChange={(e) => setIdRepoSelecionado(e.target.value)}
              className="block w-full pl-3 pr-8 py-1.5 border border-slate-200/60 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue text-xs font-bold transition-all appearance-none cursor-pointer"
            >
              {reposAcessiveis.length === 0 ? (
                <option value="">NENHUM REPOSITORIO</option>
              ) : (
                reposAcessiveis.map(repo => (
                  <option key={repo.id} value={repo.id}>{repo.nome.toUpperCase()}</option>
                ))
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* DYNAMIC HUB MODULES */}
      <div className="min-h-[calc(100vh-16rem)]">
        <AnimatePresence mode="wait">
          
          {/* MÓDULO 1: RAG CHATBOT */}
          {moduloAtivo === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="grid md:grid-cols-12 gap-5 h-[calc(100vh-16rem)] min-h-[500px]"
            >
              {/* Chat Session Sidebar */}
              <div className="md:col-span-4 lg:col-span-3 bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-md rounded-3xl border border-slate-250/20 dark:border-slate-800/40 flex flex-col overflow-hidden shadow-xl shadow-slate-100/10 dark:shadow-none">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={lidarNovoChat}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-fluid-blue hover:bg-fluid-deep text-white rounded-xl text-xs uppercase tracking-wider font-extrabold shadow-md shadow-fluid-blue/15 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4.5 h-4.5" />
                    Nova Conversa
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
                  {chats.map(chat => (
                    <div
                      key={chat.id}
                      onClick={() => setIdChatAtivo(chat.id)}
                      className={`group flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                        idChatAtivo === chat.id
                          ? 'bg-fluid-blue/8 border-fluid-blue/20 text-fluid-blue'
                          : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                        <MessageSquare className="w-4 h-4 flex-shrink-0 opacity-70" />
                        <span className="truncate">{chat.titulo}</span>
                      </div>
                      <button
                        onClick={(e) => lidarDeletarChat(chat.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-all"
                        title="Excluir conversa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {chats.length === 0 && (
                    <div className="text-center py-12 text-[11px] font-semibold text-slate-400">
                      Sem chats anteriores.
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Core Workspace */}
              <div className="md:col-span-8 lg:col-span-9 bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-md rounded-3xl border border-slate-250/20 dark:border-slate-800/40 flex flex-col overflow-hidden shadow-xl shadow-slate-100/10 dark:shadow-none">
                
                {/* Session details in top bar */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-fluid-blue/10 flex items-center justify-center text-fluid-blue shadow-inner">
                    <Bot className="w-5.5 h-5.5 animate-[pulse_4s_infinite]" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                      Assistente Cognitivo Fluidocs
                      <span className="w-2.5 h-2.5 bg-fluid-success rounded-full ring-4 ring-fluid-success/15" />
                    </h3>
                    <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                      Fonte: <span className="text-fluid-blue">{obterNomeRepositorio(idRepoSelecionado).toUpperCase()}</span>
                    </p>
                  </div>
                </div>

                {/* Dialog Panel */}
                <div ref={painelMensagensRef} className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin">
                  {!chatAtivo || chatAtivo.mensagens.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                      <motion.div 
                        animate={{ y: [0, -8, 0] }}
                        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                        className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-fluid-blue to-fluid-deep text-white flex items-center justify-center mb-5 shadow-lg shadow-fluid-blue/20"
                      >
                        <Bot className="w-9 h-9" />
                      </motion.div>
                      <h4 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight">Pergunte à sua documentação</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-medium">
                        O assistente lerá seus documentos conectados, gerará uma resposta fundamentada e anexará as referências originais com destaques de texto.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {chatAtivo.mensagens.map(msg => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex gap-3 max-w-3xl ${msg.papel === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-md transition-all ${
                            msg.papel === 'user'
                              ? 'bg-fluid-blue/10 border-fluid-blue/20 text-fluid-blue'
                              : 'bg-fluid-success/10 border-fluid-success/20 text-fluid-success'
                          }`}>
                            {msg.papel === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                          </div>
                          
                          <div className={`p-4.5 rounded-3xl text-sm leading-relaxed border ${
                            msg.papel === 'user'
                              ? 'bg-gradient-to-tr from-fluid-blue to-fluid-deep text-white border-transparent rounded-tr-none shadow-md shadow-fluid-blue/10'
                              : 'bg-slate-50/70 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border-slate-200/50 dark:border-slate-800/40 rounded-tl-none shadow-inner'
                          }`}>
                            <div className="whitespace-pre-wrap font-medium">{msg.conteudo}</div>

                            {/* Citations block */}
                            {msg.anexos && msg.anexos.length > 0 && (
                              <div className="mt-4 pt-3.5 border-t border-slate-200/60 dark:border-slate-800/60">
                                <p className="text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1">
                                  <Compass className="w-3.5 h-3.5 text-fluid-blue" />
                                  Fontes consultadas:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {msg.anexos.map((arq, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => {
                                        setArquivoSelecionado(arq);
                                        setModalAberto(true);
                                      }}
                                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-fluid-blue hover:text-fluid-blue text-[10px] font-bold text-slate-655 dark:text-slate-300 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                                    >
                                      {getIconeArquivo(arq.tipo)}
                                      <span className="truncate max-w-44">{arq.titulo}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {estaProcessandoIA && (
                        <div className="flex gap-3 max-w-3xl">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-fluid-success/10 border border-fluid-success/20 text-fluid-success animate-pulse">
                            <Bot className="w-5 h-5" />
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/30 p-4.5 rounded-3xl rounded-tl-none border border-slate-200/50 dark:border-slate-800/40 flex items-center gap-2 shadow-inner">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-550 animate-bounce [animation-delay:-0.3s]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-550 animate-bounce [animation-delay:-0.15s]" />
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-550 animate-bounce" />
                            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 ml-1.5">Buscando trechos relevantes nos documentos...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Text input area */}
                <div className="p-4.5 border-t border-slate-100 dark:border-slate-800 bg-slate-550/5 dark:bg-slate-900/30">
                  <form onSubmit={lidarEnvioChat} className="flex gap-3.5 max-w-4xl mx-auto">
                    <input
                      type="text"
                      value={entradaChat}
                      onChange={(e) => setEntradaChat(e.target.value)}
                      placeholder="Faça uma pergunta sobre a documentação corporativa..."
                      className="flex-1 px-4.5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!entradaChat.trim() || estaProcessandoIA}
                      className="p-4 bg-fluid-blue hover:bg-fluid-deep text-white rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer active:scale-95"
                    >
                      <Send className="w-4.5 h-4.5" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* MÓDULO 2: ELASTICSEARCH HYBRID SEARCH */}
          {moduloAtivo === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Central Search Form */}
              <div className="bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-xl shadow-slate-100/10 dark:shadow-none">
                <form onSubmit={lidarComBusca} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-450">
                        <Search className="w-5.5 h-5.5 text-fluid-blue" />
                      </div>
                      <input
                        type="text"
                        value={termoBusca}
                        onChange={(e) => setTermoBusca(e.target.value)}
                        placeholder="Pesquise por termos, frases ou informações dos documentos..."
                        className="block w-full pl-12 pr-4 py-3.5 bg-slate-50/50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue text-[15px] font-medium placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`p-3.5 border rounded-2xl flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                          mostrarFiltros
                            ? 'border-fluid-blue bg-fluid-blue/10 text-fluid-blue shadow-inner'
                            : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-900/40'
                        }`}
                        title="Configurações de busca"
                      >
                        <Filter className="w-5 h-5" />
                      </button>
                      <button
                        type="submit"
                        disabled={isPending || !idRepoSelecionado}
                        className="px-7 py-3.5 bg-fluid-blue hover:bg-fluid-deep text-white font-bold rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        {isPending ? 'Buscando...' : 'Pesquisar'}
                      </button>
                    </div>
                  </div>

                  {/* BM25 vs Vectorized filters */}
                  <AnimatePresence>
                    {mostrarFiltros && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-slate-100 dark:border-slate-800 pt-4"
                      >
                        <div className="flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-150/10 inline-flex">
                          <input
                            type="checkbox"
                            id="modo_hibrido_hub"
                            checked={buscaHibrida}
                            onChange={(e) => setBuscaHibrida(e.target.checked)}
                            className="h-4.5 w-4.5 rounded border-slate-350 text-fluid-blue focus:ring-fluid-blue cursor-pointer"
                          />
                          <label htmlFor="modo_hibrido_hub" className="text-xs font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                            Ampliar busca por contexto, não só por palavras exatas
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* RESULTS FEED */}
              {isPending ? (
                <div className="space-y-4">
                  {[1, 2].map(idx => (
                    <div key={idx} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 p-5 flex gap-4 animate-pulse">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex-shrink-0" />
                      <div className="flex-1 space-y-2.5">
                        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                        <div className="h-4 bg-slate-100 dark:bg-slate-700/50 rounded w-3/4" />
                        <div className="h-3 bg-slate-100 dark:bg-slate-700/50 rounded w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : termoPesquisado ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">
                    <span>Resultados da busca ({totalResultados})</span>
                    <span className="flex items-center gap-1 text-fluid-blue">
                      <Zap className="w-3.5 h-3.5 text-fluid-blue" />
                      Modo: {buscaHibrida ? 'CONTEXTO AMPLIADO' : 'PALAVRAS EXATAS'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {resultadosBusca.map(resultado => (
                      <div
                        key={resultado.id}
                        className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200/40 dark:border-slate-800/40 p-5.5 hover:border-slate-350 dark:hover:border-slate-650 hover:shadow-md transition-all flex items-start gap-4"
                      >
                        <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200/20">
                          {getIconeArquivo(resultado.tipo)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-extrabold text-slate-900 dark:text-white truncate text-base pr-4">
                              {resultado.titulo}
                            </h4>
                            <button
                              onClick={() => {
                                setArquivoSelecionado({
                                  ...resultado,
                                  repositorio: obterNomeRepositorio(resultado.repositorio),
                                });
                                setModalAberto(true);
                              }}
                              className="p-2 text-slate-400 hover:text-fluid-blue hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                              title="Visualizar trechos e detalhes"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                          </div>

                          {/* Safe XSS Highlight */}
                          <p className="text-xs font-medium text-slate-655 dark:text-slate-300 leading-relaxed mb-4">
                            {criarPreviaTexto(resultado.trecho || '')}
                          </p>

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-4 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-200/20 text-fluid-blue">
                              <Database className="w-3.5 h-3.5" /> {obterNomeRepositorio(resultado.repositorio)}
                            </span>
                            {typeof resultado.pontuacao === 'number' && (
                              <span>Pontuacao: {resultado.pontuacao.toFixed(2)}</span>
                            )}
                            {resultado.data && (
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {resultado.data}</span>
                            )}
                            {resultado.tamanho && (
                              <span>{resultado.tamanho}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {resultadosBusca.length === 0 && (
                      <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500">
                        Nenhum documento encontrado para os termos informados.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20 bg-white/80 dark:bg-[#1F2937]/90 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 text-slate-450 dark:text-slate-500 shadow-md">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-20 text-fluid-blue" />
                  <h4 className="font-extrabold text-slate-800 dark:text-white text-base">Inicie sua pesquisa</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto font-medium">
                    Consulte relatórios e cláusulas disponíveis na nuvem privada.
                  </p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Detail Modal */}
      <ModalArquivo 
        isOpen={modalAberto} 
        onClose={() => setModalAberto(false)} 
        arquivo={arquivoSelecionado} 
      />

    </div>
  );
}
