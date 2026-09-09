import { X, FileText, File, Image as ImageIcon, Database, ShieldCheck, Calendar } from 'lucide-react';
import { DadosArquivo } from '../tipos';
import { motion, AnimatePresence } from 'motion/react';
import { formatarTextoDocumento } from '../utils/formatacaoDocumento';

interface PropsModalArquivo {
  isOpen: boolean;
  onClose: () => void;
  arquivo: DadosArquivo | null;
}

export function ModalArquivo({ isOpen, onClose, arquivo }: PropsModalArquivo) {
  if (!arquivo) return null;

  const getIcon = (tipo: string) => {
    switch (tipo?.toLowerCase()) {
      case 'pdf': return <FileText className="w-14 h-14 text-red-500" />;
      case 'doc':
      case 'docx': return <File className="w-14 h-14 text-fluid-blue" />;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'image': return <ImageIcon className="w-14 h-14 text-fluid-success" />;
      default: return <File className="w-14 h-14 text-slate-500" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative bg-white dark:bg-slate-850 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200/50 dark:border-slate-800/50 z-10"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/20">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 bg-fluid-light/50 dark:bg-slate-900/60 border border-slate-200/20 rounded-2xl flex items-center justify-center shadow-inner">
                  {getIcon(arquivo.tipo)}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="truncate">{arquivo.titulo}</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold bg-fluid-success/10 border border-fluid-success/20 text-fluid-success rounded-full flex items-center gap-1 shrink-0">
                      <ShieldCheck className="w-3 h-3" /> Seguro
                    </span>
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-550 dark:text-slate-400 mt-1.5 uppercase tracking-wide">
                    <span className="flex items-center gap-1 text-fluid-blue">
                      <Database className="w-3.5 h-3.5" /> {arquivo.repositorio}
                    </span>
                    {arquivo.data && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {arquivo.data}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 text-slate-450 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all cursor-pointer" title="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
              <div className="md:w-1/2 bg-slate-50/50 dark:bg-slate-900/60 border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col items-center justify-center relative min-h-[300px]">
                <div className="absolute inset-0 pointer-events-none opacity-20 z-0 overflow-hidden">
                  <svg className="absolute w-[200%] h-[40%] bottom-0 text-fluid-light/40 dark:text-slate-800/40" viewBox="0 0 1200 120" preserveAspectRatio="none">
                    <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 L1000,120 L0,120 Z" fill="currentColor" />
                  </svg>
                </div>

                <div className="text-center flex flex-col items-center max-w-xs z-10">
                  <div className="relative p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-250/20 mb-6">
                    {getIcon(arquivo.tipo)}
                  </div>
                  <h4 className="font-extrabold text-slate-850 dark:text-slate-200">Trecho do Documento</h4>
                  <p className="text-xs text-slate-455 dark:text-slate-400 mt-2 leading-relaxed">
                    A busca retorna os trechos indexados mais relevantes para consulta.
                  </p>
                </div>
              </div>

              <div className="md:w-1/2 flex flex-col bg-white dark:bg-slate-850 min-h-[350px]">
                <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-3 bg-slate-50/20 dark:bg-slate-800/10">
                  <div className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 border-fluid-blue text-fluid-blue relative flex items-center gap-1.5">
                    <FileText className="w-4 h-4" /> Informacoes
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div>
                      <h5 className="text-xs font-extrabold text-slate-400 dark:text-slate-550 uppercase tracking-widest mb-2.5">
                        Destaque / Resumo do Documento
                      </h5>
                      {arquivo.trecho ? (
                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-250/20 dark:border-slate-800/40 shadow-inner">
                          {formatarTextoDocumento(arquivo.trecho)}
                        </div>
                      ) : (
                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4.5 rounded-2xl border border-slate-250/20 dark:border-slate-800/40 shadow-inner">
                          Nenhum trecho destacado disponivel para este arquivo.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-50/40 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Extensao</span>
                        <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase">{arquivo.tipo}</span>
                      </div>

                      {typeof arquivo.pontuacao === 'number' && (
                        <div className="bg-slate-50/40 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Pontuacao</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{arquivo.pontuacao.toFixed(2)}</span>
                        </div>
                      )}

                      {arquivo.tamanho && (
                        <div className="bg-slate-50/40 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Tamanho</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{arquivo.tamanho}</span>
                        </div>
                      )}

                      {arquivo.autor && (
                        <div className="bg-slate-50/40 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Registrado por</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{arquivo.autor}</span>
                        </div>
                      )}

                      {arquivo.data && (
                        <div className="bg-slate-50/40 dark:bg-slate-900/20 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40">
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Ultima modificacao</span>
                          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-200">{arquivo.data}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
