import React, { useEffect, useMemo, useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  File,
  FileText,
  Image as ImageIcon,
  Eye,
  Filter,
  Zap,
  DatabaseZap,
} from 'lucide-react';
import { useDadosStore } from '../store/useDadosStore';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { ModalArquivo } from '../components/ModalArquivo';
import { DadosArquivo } from '../tipos';
import { api, extrairMensagemErro } from '../services/api';
import { criarPreviaTexto } from '../utils/formatacaoDocumento';

export function Busca() {
  const { usuario } = useAutenticacaoStore();
  const { repositorios } = useDadosStore();

  const [termoBusca, setTermoBusca] = useState('');
  const [termoPesquisado, setTermoPesquisado] = useState('');
  const [resultadosBusca, setResultadosBusca] = useState<DadosArquivo[]>([]);
  const [totalResultados, setTotalResultados] = useState(0);
  const [erroBusca, setErroBusca] = useState<string | null>(null);
  const [buscaHibrida, setBuscaHibrida] = useState(true);
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [idRepoSelecionado, setIdRepoSelecionado] = useState<string>('');
  const [arquivoSelecionado, setArquivoSelecionado] = useState<DadosArquivo | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

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

  return (
    <div className="space-y-6">
      <div className="bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-xl rounded-3xl p-5 border border-slate-200/50 dark:border-slate-800/40 shadow-xl shadow-slate-100/40 dark:shadow-none flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-fluid-blue/10 flex items-center justify-center text-fluid-blue shadow-inner">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Busca de Documentos</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">Pesquise por palavras-chave ou contexto em seus documentos</p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 px-4 py-2 border border-slate-100 dark:border-slate-800 rounded-2xl whitespace-nowrap">
          <label className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <DatabaseZap className="w-4 h-4 text-fluid-blue animate-[pulse_3s_infinite]" />
            Repositorio:
          </label>
          <select
            value={idRepoSelecionado}
            onChange={(e) => setIdRepoSelecionado(e.target.value)}
            className="block pl-3 pr-8 py-1.5 border border-slate-200/60 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue text-xs font-bold transition-all appearance-none cursor-pointer"
          >
            {reposAcessiveis.length === 0 ? (
              <option value="">NENHUM REPOSITORIO</option>
            ) : (
              reposAcessiveis.map(repo => (
                <option key={repo.id} value={repo.id}>{repo.nome.toUpperCase()}</option>
              ))
            )}
          </select>
        </div>
      </div>

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
                placeholder="Pesquise por termos, frases ou informacoes dos documentos..."
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
                title="Configuracoes de busca"
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
                    id="modo_hibrido_busca"
                    checked={buscaHibrida}
                    onChange={(e) => setBuscaHibrida(e.target.checked)}
                    className="h-4.5 w-4.5 rounded border-slate-350 text-fluid-blue focus:ring-fluid-blue cursor-pointer"
                  />
                  <label htmlFor="modo_hibrido_busca" className="text-xs font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer">
                    Ampliar busca por contexto, nao so por palavras exatas
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>

      {erroBusca && (
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-4 text-sm text-amber-700 dark:text-amber-300">
          {erroBusca}
        </div>
      )}

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

                  <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold mb-2.5 line-clamp-2">
                    {obterNomeRepositorio(resultado.repositorio)}
                  </p>

                  <div className="bg-slate-50/50 dark:bg-slate-900/30 p-3 rounded-2xl border border-slate-200/20 dark:border-slate-800/20 mb-2.5">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                      {criarPreviaTexto(resultado.trecho || '')}
                    </p>
                  </div>

                  {(resultado.tamanho || resultado.data) && (
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 flex-wrap gap-2">
                      {resultado.tamanho && <span>{resultado.tamanho}</span>}
                      {resultado.data && <span>{resultado.data}</span>}
                    </div>
                  )}

                  {typeof resultado.pontuacao === 'number' && (
                    <div className="text-[10px] font-extrabold text-fluid-blue uppercase tracking-widest">
                      Pontuacao do documento: {resultado.pontuacao.toFixed(2)}
                    </div>
                  )}
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
        <div className="bg-white/80 dark:bg-[#1F2937]/90 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/40 p-12 flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-fluid-blue to-fluid-deep text-white flex items-center justify-center mb-5 shadow-lg shadow-fluid-blue/20"
          >
            <Search className="w-9 h-9" />
          </motion.div>
          <h3 className="text-lg font-extrabold text-slate-800 dark:text-white tracking-tight mb-2">Comece a sua pesquisa</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
            Digite palavras-chave ou frases para buscar no repositorio selecionado. Use o modo de contexto ampliado para resultados mais relevantes.
          </p>
        </div>
      )}

      {arquivoSelecionado && (
        <ModalArquivo 
          arquivo={arquivoSelecionado} 
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
        />
      )}
    </div>
  );
}
