import React, { useState } from 'react';
import { useDadosStore, type Repositorio } from '../store/useDadosStore';
import { api, extrairMensagemErro } from '../services/api';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit3, 
  ExternalLink, 
  Folder, 
  Server, 
  X, 
  Upload,
  FileCheck,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FormState {
  nome: string;
  url: string;
  tipo: 'gdrive' | 'onedrive' | 'local';
  gruposAcesso: string[];
}

export function Repositorios() {
  const { 
    repositorios, 
    adicionarRepositorio, 
    atualizarRepositorio, 
    removerRepositorio, 
    inserirRepositorio,
    gruposAcesso 
  } = useDadosStore();
  
  const [modalAberto, setModalAberto] = useState(false);
  const [idEditando, setIdEditando] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<'remoto' | 'local'>('remoto');
  const [formularioLocalAberto, setFormularioLocalAberto] = useState(false);
  
  const [formulario, setFormulario] = useState<FormState>({
    nome: '',
    url: '',
    tipo: 'gdrive',
    gruposAcesso: []
  });

  const [erroModal, setErroModal] = useState<string | null>(null);

  const [importDescricao, setImportDescricao] = useState('');
  const [importArquivos, setImportArquivos] = useState<File[]>([]);
  const [importGruposAcesso, setImportGruposAcesso] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'ocioso' | 'calculando' | 'pronto' | 'enviando'>('ocioso');
  const [importHashes, setImportHashes] = useState<Record<string, string>>({});
  const [importMensagem, setImportMensagem] = useState<string>('');
  const [importErro, setImportErro] = useState<string | null>(null);

  const lidarAbrirModal = (repo?: Repositorio) => {
    if (repo) {
      setIdEditando(repo.id);
      setFormulario({
        nome: repo.nome,
        url: repo.url,
        tipo: repo.tipo,
        gruposAcesso: repo.gruposAcesso || []
      });
    } else {
      setIdEditando(null);
      setFormulario({ 
        nome: '', 
        url: '', 
        tipo: 'gdrive', 
        gruposAcesso: [] 
      });
    }
    setModalAberto(true);
  };

  const lidarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formulario.nome.trim() || !formulario.url.trim()) {
      setErroModal('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    try {
      if (idEditando) {
        await api.atualizarRepositorio(idEditando, {
          descricao: formulario.nome,
          url_repositorio_integracao: formulario.url,
          tipo: formulario.tipo,
          gruposAcesso: formulario.gruposAcesso,
        });
        atualizarRepositorio(idEditando, formulario);
      } else {
        adicionarRepositorio(formulario);
      }
      setModalAberto(false);
    } catch (err) {
      setModalAberto(false);
      setErroModal('Ocorreu um erro ao salvar o repositório.');
    }
  };

  const lidarRemoverRepositorio = async (id: string) => {
    try {
      await api.deletarRepositorio(id);
      removerRepositorio(id);
    } catch (err) {
      setErroModal(extrairMensagemErro(err));
    }
  };

  const formatarTamanhoArquivo = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const calcularHashesEmWorker = (files: File[]) => {
    return new Promise<Record<string, string>>((resolve, reject) => {
      const worker = new Worker(new URL('../workers/hashWorker.ts', import.meta.url), { type: 'module' });

      worker.onmessage = (event) => {
        worker.terminate();
        if (event.data?.error) {
          reject(new Error(event.data.error));
          return;
        }
        resolve(event.data.hashes as Record<string, string>);
      };

      worker.onerror = (event) => {
        worker.terminate();
        reject(new Error(event.message));
      };

      worker.postMessage({ files });
    });
  };

  const lidarSelecionarArquivos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setImportArquivos(files);
    setImportStatus('calculando');
    setImportHashes({});
    setImportMensagem('Calculando hash seguro dos arquivos no navegador...');

    try {
      const hashes = await calcularHashesEmWorker(files);
      setImportHashes(hashes);
      setImportStatus('pronto');
      setImportMensagem('Arquivos processados com sucesso. Pronto para enviar.');
    } catch (err) {
      setImportStatus('ocioso');
      setImportErro('Falha ao calcular o hash dos arquivos. Tente novamente.');
    }
  };

  const alternarGrupoAcesso = (grupoId: string) => {
    setImportGruposAcesso((atual) =>
      atual.includes(grupoId) ? atual.filter((id) => id !== grupoId) : [...atual, grupoId]
    );
  };

  const lidarEnviarImportacaoLocal = async () => {
    const descricao = importDescricao.trim();

    if (!descricao) {
      setImportErro('Informe um nome para a fonte temporária.');
      return;
    }

    if (descricao.length < 5) {
      setImportErro('O nome da fonte deve ter pelo menos 5 caracteres.');
      return;
    }

    if (!importArquivos.length) {
      setImportErro('Selecione ao menos um arquivo para importar.');
      return;
    }

    const envioZip =
      importArquivos.length === 1 && importArquivos[0].name.toLowerCase().endsWith('.zip');

    if (!envioZip) {
      setImportErro(
        'O orquestrador aceita apenas um arquivo .zip por envio. Compacte seus documentos em um ZIP e tente novamente.'
      );
      return;
    }

    setImportErro(null);
    setImportStatus('enviando');
    setImportMensagem('Enviando arquivos para o orquestrador para criação da fonte temporária...');

    try {
      const repositorioCriado = await api.importarRepositorioZip(descricao, importArquivos[0]);

      inserirRepositorio({
        id: repositorioCriado.id,
        nome: repositorioCriado.descricao,
        url: repositorioCriado.url_repositorio_integracao,
        tipo: repositorioCriado.tipo,
        gruposAcesso: repositorioCriado.gruposAcesso,
      });

      setImportDescricao('');
      setImportArquivos([]);
      setImportGruposAcesso([]);
      setImportStatus('ocioso');
      setImportHashes({});
      setImportMensagem('');
      setFormularioLocalAberto(false);
    } catch (err) {
      setImportStatus('ocioso');
      setImportMensagem('');
      setImportErro(extrairMensagemErro(err));
    }
  };

  const getIconeTipo = (tipo: string) => {
    switch (tipo) {
      case 'gdrive': 
        return <Folder className="w-5 h-5 text-emerald-500" />;
      case 'onedrive': 
        return <Folder className="w-5 h-5 text-fluid-blue" />;
      case 'local': 
        return <Server className="w-5 h-5 text-slate-500" />;
      default: 
        return <Database className="w-5 h-5 text-indigo-500" />;
    }
  };

  const getRotuloTipo = (tipo: string) => {
    switch (tipo) {
      case 'gdrive': return 'Google Drive';
      case 'onedrive': return 'Microsoft OneDrive';
      case 'local': return 'Servidor Local';
      default: return 'Banco de Dados';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Repositórios
          </h1>
          <p className="text-slate-655 dark:text-slate-400 font-medium">
            Gerencie suas fontes de pesquisa de forma rápida e organizada.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200/60 dark:border-slate-800/50 bg-white dark:bg-slate-850 p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Gerenciar fontes
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Use as abas para alternar entre repositórios remotos e a importação local temporária.
            </p>
          </div>
          <div className="inline-flex rounded-3xl bg-slate-100 dark:bg-slate-900 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setAbaAtiva('remoto')}
              aria-selected={abaAtiva === 'remoto'}
              className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${abaAtiva === 'remoto' ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Repositório remoto
            </button>
            <button
              type="button"
              onClick={() => setAbaAtiva('local')}
              aria-selected={abaAtiva === 'local'}
              className={`rounded-3xl px-4 py-2 text-sm font-semibold transition ${abaAtiva === 'local' ? 'bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              Repositório local
            </button>
          </div>
        </div>

        <div className="mt-6">
          {abaAtiva === 'local' && (
            <div className="space-y-6">
              {/* Barra de ação com botão idêntico ao da aba remota */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setImportErro(null);
                    setImportMensagem('');
                    setFormularioLocalAberto(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  Adicionar fonte de dados temporária
                </button>
              </div>

              {/* Grid de cards de repositórios locais já criados */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repositorios.filter(r => r.tipo === 'local').map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 p-6 flex flex-col hover:border-slate-350 dark:hover:border-slate-650 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-200/10">
                          <Server className="w-5 h-5 text-slate-500" />
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-fluid-blue uppercase tracking-widest block">
                            Fonte temporária local
                          </span>
                          <h3 className="text-base font-extrabold text-slate-850 dark:text-white group-hover:text-fluid-blue transition-colors truncate max-w-44">
                            {repo.nome}
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => lidarAbrirModal(repo)}
                          className="p-2 text-slate-400 hover:text-fluid-blue hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => lidarRemoverRepositorio(repo.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200/20 mb-2">
                      <FileCheck className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                      <span className="truncate font-mono">{repo.url}</span>
                    </div>
                  </motion.div>
                ))}

                {repositorios.filter(r => r.tipo === 'local').length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                    Nenhuma fonte temporária adicionada. Clique em "Adicionar fonte de dados temporária" para começar.
                  </div>
                )}
              </div>
            </div>
          )}

          {abaAtiva === 'remoto' && (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => lidarAbrirModal()}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all active:scale-[0.98]"
                >
                  <Plus className="w-5 h-5" />
                  Conectar Repositório
                </button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {repositorios.filter(r => r.tipo !== 'local').map((repo, index) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="bg-white dark:bg-slate-850 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 p-6 flex flex-col hover:border-slate-350 dark:hover:border-slate-650 hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-slate-50 dark:bg-slate-900/60 flex items-center justify-center border border-slate-200/10">
                          {getIconeTipo(repo.tipo)}
                        </div>
                        <div>
                          <span className="text-[9px] font-extrabold text-fluid-blue uppercase tracking-widest block">
                            {getRotuloTipo(repo.tipo)}
                          </span>
                          <h3 className="text-base font-extrabold text-slate-850 dark:text-white group-hover:text-fluid-blue transition-colors truncate max-w-44">
                            {repo.nome}
                          </h3>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => lidarAbrirModal(repo)}
                          className="p-2 text-slate-400 hover:text-fluid-blue hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => lidarRemoverRepositorio(repo.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer"
                          title="Deletar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 rounded-2xl border border-slate-200/20 mb-5">
                      <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0 text-slate-400" />
                      <span className="truncate select-all font-mono">{repo.url}</span>
                    </div>
                    {/*
                    <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">
                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                        Grupos Autorizados:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {repo.gruposAcesso && repo.gruposAcesso.length > 0 ? (
                          repo.gruposAcesso.map(idGrupo => {
                            const grupo = gruposAcesso.find(g => g.id === idGrupo);
                            return grupo ? (
                              <span 
                                key={idGrupo} 
                                className="px-2.5 py-1 bg-fluid-light/50 dark:bg-fluid-blue/10 border border-fluid-blue/10 text-fluid-blue dark:text-fluid-light rounded-lg text-xxs font-extrabold tracking-wide uppercase"
                              >
                                {grupo.nome}
                              </span>
                            ) : null;
                          })
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold italic uppercase tracking-wider">
                            Sem restrição (Geral)
                          </span>
                        )}
                      </div>
                    </div>*/}
                  </motion.div>
                ))}

                {repositorios.filter(r => r.tipo !== 'local').length === 0 && (
                  <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400">
                    Nenhum repositório conectado.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* DETALHE EXTRA: DEMONSTRAÇÃO DO CLIENT-SIDE HASHING SHA-256 (MANDATÓRIO SDD) */}


      {/* MODAL CONNECTOR */}
      <AnimatePresence>
        {modalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalAberto(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative max-w-md w-full bg-white dark:bg-slate-850 rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 z-10"
            >
              
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Database className="w-5 h-5 text-fluid-blue" />
                  {idEditando ? 'Editar Fonte' : 'Conectar Nova Fonte'}
                </h2>
                <button
                  onClick={() => setModalAberto(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Input Form */}
              <form onSubmit={lidarEnvio} className="space-y-4">
                
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Nome Identificador da Fonte
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.nome}
                    onChange={e => setFormulario({...formulario, nome: e.target.value})}
                    placeholder="Ex: Biblioteca de Contratos 2026"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all"
                  />
                </div>

                {/* URL */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Caminho ou Pasta Remota
                  </label>
                  <input
                    type="text"
                    required
                    value={formulario.url}
                    onChange={e => setFormulario({...formulario, url: e.target.value})}
                    placeholder="Ex: gdrive://id-pasta-departamento"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all"
                  />
                </div>

                {/* Tipo de provedor */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Tipo do Servidor de Integração
                  </label>
                  <select
                    value={formulario.tipo}
                    onChange={e => setFormulario({...formulario, tipo: e.target.value as any})}
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all cursor-pointer"
                  >
                    <option value="gdrive">Google Drive</option>
                    <option value="onedrive">Microsoft OneDrive</option>
                    <option value="local">Servidor interno</option>
                  </select>
                </div>

                {/* Grupos de Acesso (RBAC Checkbox list) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Grupos com Acesso Autorizado
                  </label>
                  <div className="space-y-2 max-h-36 overflow-y-auto p-3 border border-slate-200 dark:border-slate-750 rounded-xl bg-slate-50 dark:bg-slate-900/60 scrollbar-thin">
                    {gruposAcesso.map(grupo => (
                      <label key={grupo.id} className="flex items-center space-x-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formulario.gruposAcesso.includes(grupo.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormulario({
                                ...formulario, 
                                gruposAcesso: [...formulario.gruposAcesso, grupo.id]
                              });
                            } else {
                              setFormulario({
                                ...formulario, 
                                gruposAcesso: formulario.gruposAcesso.filter(id => id !== grupo.id)
                              });
                            }
                          }}
                          className="h-4.5 w-4.5 rounded border-slate-350 text-fluid-blue focus:ring-fluid-blue cursor-pointer"
                        />
                        <span className="text-xs font-bold text-slate-750 dark:text-slate-300">
                          {grupo.nome.toUpperCase()}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalAberto(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-fluid-blue/15"
                  >
                    {idEditando ? 'Salvar Alterações' : 'Salvar Fonte'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL IMPORTAÇÃO LOCAL */}
      <AnimatePresence>
        {formularioLocalAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setFormularioLocalAberto(false);
                setImportErro(null);
                setImportMensagem('');
                setImportArquivos([]);
                setImportDescricao('');
                setImportHashes({});
                setImportStatus('ocioso');
              }}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="relative max-w-lg w-full bg-white dark:bg-slate-850 rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Upload className="w-5 h-5 text-fluid-blue" />
                  Adicionar fonte de dados temporária
                </h2>
                <button
                  onClick={() => {
                    setFormularioLocalAberto(false);
                    setImportErro(null);
                    setImportMensagem('');
                    setImportArquivos([]);
                    setImportDescricao('');
                    setImportHashes({});
                    setImportStatus('ocioso');
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                {/* Nome da fonte */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Nome da fonte temporária
                  </label>
                  <input
                    type="text"
                    value={importDescricao}
                    onChange={(e) => setImportDescricao(e.target.value)}
                    placeholder="Ex: Pacote Financeiro 2026"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all"
                  />
                </div>

                {/* Upload área */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700/80 rounded-2xl p-6 bg-slate-50 dark:bg-slate-950 cursor-pointer transition-colors hover:border-fluid-blue hover:bg-slate-100 dark:hover:bg-slate-900">
                  <Upload className="w-8 h-8 text-fluid-blue mb-3" />
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Selecione um arquivo .zip</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compacte seus documentos em um ZIP antes do envio.</span>
                  <input
                    type="file"
                    accept=".zip,application/zip"
                    className="hidden"
                    onChange={lidarSelecionarArquivos}
                  />
                </label>

                {/* Lista de arquivos */}
                {importArquivos.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-950 space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Arquivos selecionados</span>
                      <span className="text-xs font-semibold text-fluid-blue">{importArquivos.length} item(s)</span>
                    </div>
                    {importArquivos.map((arquivo) => (
                      <div key={arquivo.name} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-white dark:bg-slate-900 flex items-center justify-between gap-3">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{arquivo.name}</div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{formatarTamanhoArquivo(arquivo.size)}</span>
                          {importHashes[arquivo.name] && (
                            <FileCheck className="w-4 h-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Mensagens */}
                {importErro && (
                  <div className="rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {importErro}
                  </div>
                )}
                {importMensagem && (
                  <div className="rounded-2xl bg-fluid-blue/10 border border-fluid-blue/20 p-3 text-sm text-fluid-blue">
                    {importMensagem}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setFormularioLocalAberto(false);
                      setImportErro(null);
                      setImportMensagem('');
                      setImportArquivos([]);
                      setImportDescricao('');
                      setImportHashes({});
                      setImportStatus('ocioso');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={importStatus === 'calculando' || importStatus === 'enviando' || !importArquivos.length || !importDescricao.trim()}
                    onClick={lidarEnviarImportacaoLocal}
                    className="px-5 py-2.5 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md shadow-fluid-blue/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {importStatus === 'calculando' ? 'Calculando...' : importStatus === 'enviando' ? 'Enviando...' : 'Criar fonte temporária'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL DE ERRO GLOBAL */}
      <AnimatePresence>
        {erroModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setErroModal(null)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            {/* Card */}
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative max-w-sm w-full bg-white dark:bg-slate-850 rounded-3xl shadow-2xl border border-red-200/40 dark:border-red-800/30 z-10 overflow-hidden"
            >
              {/* Faixa vermelha no topo */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-red-400 to-rose-500" />

              <div className="p-8 flex flex-col items-center text-center gap-5">
                {/* Ícone */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.08, type: 'spring', stiffness: 320, damping: 22 }}
                  className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/40 flex items-center justify-center"
                >
                  <XCircle className="w-8 h-8 text-red-500" strokeWidth={1.75} />
                </motion.div>

                {/* Título */}
                <div className="space-y-1.5">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Algo deu errado
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                    {erroModal}
                  </p>
                </div>

                {/* Botão */}
                <button
                  onClick={() => setErroModal(null)}
                  className="w-full px-5 py-3 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-red-500/20"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
