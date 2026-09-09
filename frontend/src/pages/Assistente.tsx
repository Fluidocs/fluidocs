import React, { useState, useRef, useEffect, useTransition, useCallback } from 'react';
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
  Compass,
  DatabaseZap,
  ChevronDown,
  Quote,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useDadosStore } from '../store/useDadosStore';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { ModalArquivo } from '../components/ModalArquivo';
import { DadosArquivo } from '../tipos';
import { api, extrairMensagemErro } from '../services/api';
import { agruparDocumentosResposta, estruturarRespostaAgente } from '../utils/respostaAgente';

interface ConteudoRespostaAssistenteProps {
  conteudo: string;
}

function ConteudoRespostaAssistente({ conteudo }: ConteudoRespostaAssistenteProps) {
  const resposta = estruturarRespostaAgente(conteudo);

  if (!resposta.estruturada) {
    return <div className="whitespace-pre-wrap font-medium">{resposta.resposta}</div>;
  }

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center gap-2 text-fluid-blue">
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
          Resposta fundamentada
        </span>
      </div>

      <p className="whitespace-pre-wrap text-[15px] font-medium leading-7 text-slate-800 dark:text-slate-100">
        {resposta.resposta}
      </p>

      {resposta.evidencias.length > 0 && (
        <details className="group mt-5 overflow-hidden rounded-2xl border border-fluid-blue/15 bg-fluid-light/55 dark:border-fluid-blue/20 dark:bg-fluid-blue/5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-fluid-blue/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-fluid-blue dark:text-slate-200">
            <span className="flex items-center gap-2">
              <Quote className="h-4 w-4 text-fluid-blue" aria-hidden="true" />
              Ver evidências utilizadas
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] text-fluid-deep shadow-sm dark:bg-slate-800 dark:text-fluid-light">
                {resposta.evidencias.length}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 text-fluid-blue transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
          </summary>

          <div className="space-y-3 border-t border-fluid-blue/10 px-4 py-4">
            {resposta.evidencias.map((evidencia, indice) => (
              <blockquote
                key={`${indice}-${evidencia.slice(0, 24)}`}
                className="border-l-2 border-fluid-blue/50 pl-3 text-xs leading-6 text-slate-600 dark:text-slate-300"
              >
                <span className="mb-1 block text-[9px] font-bold uppercase tracking-widest text-fluid-blue">
                  Evidência {indice + 1}
                </span>
                {evidencia}
              </blockquote>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export function Assistente() {
  const { usuario } = useAutenticacaoStore();
  const {
    chats,
    repositorios,
    definirRepositorios,
    definirChats,
    definirSessaoChat,
    adicionarMensagemChat,
    removerSessaoChat,
  } = useDadosStore();
  
  // Selected Integration Repository
  const [idRepoSelecionado, setIdRepoSelecionado] = useState('');

  // RAG Chat states
  const [idChatAtivo, setIdChatAtivo] = useState<string | null>(chats[0]?.id || null);
  const [entradaChat, setEntradaChat] = useState('');
  const [estaProcessandoIA, setEstaProcessandoIA] = useState(false);
  const [estaCarregandoConversas, setEstaCarregandoConversas] = useState(true);
  const [estaCarregandoRepositorios, setEstaCarregandoRepositorios] = useState(true);
  const [erroChat, setErroChat] = useState<string | null>(null);

  // Citation attachment preview modals
  const [arquivoSelecionado, setArquivoSelecionado] = useState<DadosArquivo | null>(null);
  const [modalAberto, setModalAberto] = useState(false);

  const [isPending, startTransition] = useTransition();
  const painelMensagensRef = useRef<HTMLDivElement>(null);
  const chatAtivo = chats.find(c => c.id === idChatAtivo);

  // RBAC Permission check
  const reposAcessiveis = repositorios.filter(repo => 
    usuario?.gruposAcesso.some(grupo => repo.gruposAcesso.includes(grupo))
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

  const carregarConversas = useCallback(async (idChatPreservado?: string) => {
    const conversas = await api.listarChats();
    const chatPreservado = idChatPreservado
      ? useDadosStore.getState().chats.find((chat) => chat.id === idChatPreservado)
      : undefined;
    const conversasSincronizadas = chatPreservado
      ? conversas.map((chat) =>
          chat.id === idChatPreservado
            ? { ...chat, mensagens: chatPreservado.mensagens }
            : chat
        )
      : conversas;

    startTransition(() => definirChats(conversasSincronizadas));
    return conversas;
  }, [definirChats]);

  useEffect(() => {
    let ativo = true;

    const carregar = async () => {
      setEstaCarregandoConversas(true);
      setEstaCarregandoRepositorios(true);
      setErroChat(null);
      try {
        const [, repositoriosApi] = await Promise.all([
          carregarConversas(),
          api.listarRepositorios(),
        ]);

        if (ativo) {
          definirRepositorios(
            repositoriosApi.map((repositorio) => ({
              id: repositorio.id,
              nome: repositorio.descricao,
              url: repositorio.url_repositorio_integracao,
              tipo: repositorio.tipo,
              gruposAcesso: repositorio.gruposAcesso,
            }))
          );
        }
      } catch (erro) {
        if (ativo) setErroChat(extrairMensagemErro(erro));
      } finally {
        if (ativo) {
          setEstaCarregandoConversas(false);
          setEstaCarregandoRepositorios(false);
        }
      }
    };

    void carregar();
    return () => {
      ativo = false;
    };
  }, [carregarConversas, definirRepositorios]);

  useEffect(() => {
    if (
      reposAcessiveis.length > 0 &&
      !reposAcessiveis.some((repositorio) => repositorio.id === idRepoSelecionado)
    ) {
      setIdRepoSelecionado(reposAcessiveis[0].id);
    }
  }, [idRepoSelecionado, reposAcessiveis]);

  useEffect(() => {
    const deveRolarMensagens = estaProcessandoIA || (chatAtivo?.mensagens.length ?? 0) > 0;

    if (deveRolarMensagens) {
      rolarParaBaixo();
    }
  }, [chatAtivo?.mensagens, estaProcessandoIA]);

  const lidarEnvioChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entradaChat.trim() || estaProcessandoIA || !idRepoSelecionado) return;

    setErroChat(null);
    let idChat = idChatAtivo;

    if (!idChat) {
      try {
        const novaConversa = await api.criarChat();
        idChat = novaConversa.id;
        setIdChatAtivo(novaConversa.id);
        definirSessaoChat(novaConversa);
        await carregarConversas();
      } catch (erro) {
        setErroChat(extrairMensagemErro(erro));
        return;
      }
    }

    const pergunta = entradaChat;
    adicionarMensagemChat(idChat, { papel: 'user', conteudo: pergunta });
    setEntradaChat('');
    setEstaProcessandoIA(true);

    try {
      const resposta = await api.enviarMensagemChat(idChat, pergunta, idRepoSelecionado);
      startTransition(() => {
        adicionarMensagemChat(idChat, {
          papel: 'assistant',
          conteudo: resposta.conteudo,
          anexos: resposta.anexos,
        });
      });

      await carregarConversas(idChat);
    } catch (erro) {
      setErroChat(extrairMensagemErro(erro));
      try {
        definirSessaoChat(await api.consultarChat(idChat));
      } catch {
        // Mantem a pergunta visivel quando o historico tambem fica indisponivel.
      }
    } finally {
      setEstaProcessandoIA(false);
    }
  };

  const lidarNovoChat = async () => {
    setErroChat(null);
    setEntradaChat('');
    try {
      const novaConversa = await api.criarChat();
      setIdChatAtivo(novaConversa.id);
      definirSessaoChat(novaConversa);
      await carregarConversas();
      definirSessaoChat(novaConversa);
    } catch (erro) {
      setErroChat(extrairMensagemErro(erro));
    }
  };

  const lidarSelecionarChat = async (id: string) => {
    setErroChat(null);
    setIdChatAtivo(id);
    try {
      definirSessaoChat(await api.consultarChat(id));
    } catch (erro) {
      setErroChat(extrairMensagemErro(erro));
    }
  };

  const lidarDeletarChat = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.deletarChat(id);
      removerSessaoChat(id);
      if (idChatAtivo === id) {
        setIdChatAtivo(null);
        setEntradaChat('');
      }
      await carregarConversas();
    } catch (erro) {
      setErroChat(extrairMensagemErro(erro));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/40 shadow-xl shadow-slate-100/40 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-fluid-success/10 flex items-center justify-center text-fluid-success shadow-inner">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Assistente Cognitivo</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Faça perguntas sobre seus documentos e receba respostas fundamentadas</p>
          </div>
        </div>

        {/* Global Repository Access Selector (RBAC-checked) */}
        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-2xl whitespace-nowrap">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <DatabaseZap className="w-4 h-4 text-fluid-blue animate-[pulse_3s_infinite]" />
            Repositório:
          </label>
          <select
            value={idRepoSelecionado}
            onChange={(e) => setIdRepoSelecionado(e.target.value)}
            disabled={estaCarregandoRepositorios || reposAcessiveis.length === 0}
            className="block pl-3 pr-8 py-1.5 border border-slate-200/60 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue text-xs font-bold transition-all appearance-none cursor-pointer"
          >
            {estaCarregandoRepositorios && <option value="">CARREGANDO...</option>}
            {reposAcessiveis.map(repo => (
              <option key={repo.id} value={repo.id}>{repo.nome.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Chat Layout */}
      <div className="grid md:grid-cols-12 gap-5 h-[calc(100vh-16rem)] min-h-[500px]">
        
        {/* Chat Session Sidebar */}
        <div className="md:col-span-4 lg:col-span-3 bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col overflow-hidden shadow-xl shadow-slate-100/10 dark:shadow-none">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <button
              onClick={lidarNovoChat}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-fluid-blue hover:bg-fluid-deep text-white rounded-xl text-xs uppercase tracking-wider font-extrabold shadow-md shadow-fluid-blue/15 hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              Nova Conversa
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
            {estaCarregandoConversas && (
              <div className="space-y-2 px-1 py-2" aria-label="Carregando conversas">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            )}
            {!estaCarregandoConversas && chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => void lidarSelecionarChat(chat.id)}
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
            {!estaCarregandoConversas && chats.length === 0 && (
              <div className="text-center py-12 text-[11px] font-semibold text-slate-400">
                Sem chats anteriores.
              </div>
            )}
          </div>
        </div>

        {/* Chat Core Workspace */}
        <div className="md:col-span-8 lg:col-span-9 bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-md rounded-3xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col overflow-hidden shadow-xl shadow-slate-100/10 dark:shadow-none">
          
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
              {idRepoSelecionado && (
                <p className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                  Fonte: <span className="text-fluid-blue">{reposAcessiveis.find(r => r.id === idRepoSelecionado)?.nome.toUpperCase()}</span>
                </p>
              )}
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
                    
                    <div className={`min-w-0 p-4.5 rounded-3xl text-sm leading-relaxed border ${
                      msg.papel === 'user'
                        ? 'bg-gradient-to-tr from-fluid-blue to-fluid-deep text-white border-transparent rounded-tr-none shadow-md shadow-fluid-blue/10'
                        : 'bg-white dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 border-slate-200/70 dark:border-slate-800/60 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.papel === 'assistant' ? (
                        <ConteudoRespostaAssistente conteudo={msg.conteudo} />
                      ) : (
                        <div className="whitespace-pre-wrap font-medium">{msg.conteudo}</div>
                      )}

                      {/* Documents used in the answer */}
                      {msg.anexos && msg.anexos.length > 0 && (
                        <div className="mt-5 border-t border-slate-200/60 pt-4 dark:border-slate-800/60">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                            <Compass className="w-3.5 h-3.5 text-fluid-blue" />
                              Documentos usados nesta resposta
                            </p>
                            <span className="rounded-full bg-fluid-light px-2 py-1 text-[9px] font-bold text-fluid-deep dark:bg-fluid-blue/10 dark:text-fluid-light">
                              {agruparDocumentosResposta(msg.anexos).length}
                            </span>
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2">
                            {agruparDocumentosResposta(msg.anexos).map((documento) => (
                              <button
                                key={`${documento.titulo}-${documento.tipo}`}
                                onClick={() => {
                                  setArquivoSelecionado(documento.citacoes[0]);
                                  setModalAberto(true);
                                }}
                                aria-label={`Abrir trecho citado de ${documento.titulo}`}
                                className="group/documento flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-fluid-blue/50 hover:bg-fluid-light/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-fluid-blue dark:border-slate-700/80 dark:bg-slate-800/70 dark:hover:bg-fluid-blue/5"
                              >
                                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white shadow-sm dark:bg-slate-900">
                                  {getIconeArquivo(documento.tipo)}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-xs font-bold text-slate-800 group-hover/documento:text-fluid-blue dark:text-slate-100">
                                    {documento.titulo}
                                  </span>
                                  <span className="mt-1 block text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                    {documento.quantidadeTrechos}{' '}
                                    {documento.quantidadeTrechos === 1 ? 'trecho utilizado' : 'trechos utilizados'}
                                  </span>
                                </span>
                                <ExternalLink className="h-4 w-4 flex-shrink-0 text-slate-400 transition-colors group-hover/documento:text-fluid-blue" aria-hidden="true" />
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
                placeholder={idRepoSelecionado ? 'Faça uma pergunta sobre a documentação corporativa...' : 'Selecione uma fonte disponível para conversar'}
                disabled={!idRepoSelecionado}
                className="flex-1 px-4.5 py-3.5 bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue text-sm font-medium text-slate-900 dark:text-white placeholder-slate-400 shadow-inner"
              />
              <button
                type="submit"
                disabled={!entradaChat.trim() || estaProcessandoIA || !idRepoSelecionado}
                className="p-4 bg-fluid-blue hover:bg-fluid-deep text-white rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center cursor-pointer active:scale-95"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      {arquivoSelecionado && (
        <ModalArquivo 
          arquivo={arquivoSelecionado} 
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
        />
      )}

      {/* Error notification */}
      {erroChat && (
        <div className="fixed bottom-6 right-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 rounded-2xl text-sm text-amber-700 dark:text-amber-300 shadow-lg">
          {erroChat}
        </div>
      )}
    </div>
  );
}
