import React, { useState } from 'react';
import { useDadosStore } from '../store/useDadosStore';
import { 
  Users, 
  Shield, 
  UserPlus, 
  MoreVertical, 
  Search, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Lock, 
  ShieldAlert, 
  X,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type AbaEquipe = 'usuarios' | 'grupos';

export function Equipe() {
  const { gruposAcesso, adicionarGrupoAcesso, removerGrupoAcesso } = useDadosStore();
  const [abaAtiva, setAbaAtiva] = useState<AbaEquipe>('usuarios');
  const [termoBusca, setTermoBusca] = useState('');
  
  // New access group states
  const [modalGrupoAberto, setModalGrupoAberto] = useState(false);
  const [nomeNovoGrupo, setNomeNovoGrupo] = useState('');
  const [idNovoGrupo, setIdNovoGrupo] = useState('');
  const [erroGrupo, setErroGrupo] = useState<string | null>(null);

  // Mocked active organization users
  const usuarios = [
    { id: '1', nome: 'João Silva', email: 'joao@empresa.com', funcao: 'admin', grupos: ['admin', 'rh', 'ti', 'geral'], status: 'ativo' },
    { id: '2', nome: 'Maria Souza', email: 'maria@empresa.com', funcao: 'funcionario', grupos: ['rh', 'geral'], status: 'ativo' },
    { id: '3', nome: 'Carlos Santos', email: 'carlos@empresa.com', funcao: 'funcionario', grupos: ['ti', 'geral'], status: 'ativo' },
    { id: '4', nome: 'Gabriela Lima', email: 'gabriela@empresa.com', funcao: 'funcionario', grupos: ['rh'], status: 'convidado' }
  ];

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(termoBusca.toLowerCase()) || 
    u.email.toLowerCase().includes(termoBusca.toLowerCase())
  );

  const lidarCriarGrupo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeNovoGrupo.trim() || !idNovoGrupo.trim()) {
      setErroGrupo('Todos os campos são obrigatórios.');
      return;
    }
    
    if (gruposAcesso.some(g => g.id === idNovoGrupo.trim().toLowerCase())) {
      setErroGrupo('Já existe um grupo cadastrado com este ID único.');
      return;
    }

    adicionarGrupoAcesso({
      id: idNovoGrupo.trim().toLowerCase(),
      nome: nomeNovoGrupo.trim()
    });

    setModalGrupoAberto(false);
    setNomeNovoGrupo('');
    setIdNovoGrupo('');
    setErroGrupo(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-sans">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-2">
            Controle de Acessos & Equipe
          </h1>
          <p className="text-slate-655 dark:text-slate-400 font-medium">
            Gerencie funções administrativas, permissões e grupos de segurança dos documentos.
          </p>
        </div>
        
        {abaAtiva === 'usuarios' ? (
          <button className="flex items-center justify-center gap-2 px-6 py-3.5 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all active:scale-[0.98] w-full sm:w-auto cursor-pointer">
            <UserPlus className="w-5 h-5" />
            Convidar Colaborador
          </button>
        ) : (
          <button 
            onClick={() => setModalGrupoAberto(true)}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold rounded-2xl shadow-lg shadow-fluid-blue/15 hover:shadow-xl transition-all active:scale-[0.98] w-full sm:w-auto cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Criar Grupo
          </button>
        )}
      </div>

      {/* Main Tabs Container */}
      <div className="bg-white/85 dark:bg-[#1F2937]/90 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden shadow-xl shadow-slate-100/10 dark:shadow-none transition-all">
        
        {/* Sub-Header Tab navigation */}
        <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/20 dark:bg-slate-800/10">
          <nav className="flex px-6" aria-label="Abas de equipe">
            <button
              onClick={() => setAbaAtiva('usuarios')}
              className={`whitespace-nowrap py-5 px-4 border-b-2 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'usuarios'
                  ? 'border-fluid-blue text-fluid-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Users className="w-4.5 h-4.5" />
              Colaboradores Ativos
            </button>
            <button
              onClick={() => setAbaAtiva('grupos')}
              className={`whitespace-nowrap py-5 px-4 border-b-2 font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                abaAtiva === 'grupos'
                  ? 'border-fluid-blue text-fluid-blue'
                  : 'border-transparent text-slate-400 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="w-4.5 h-4.5" />
              Grupos de Segurança
            </button>
          </nav>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            
            {/* TABS 1: MEMBERS LIST */}
            {abaAtiva === 'usuarios' && (
              <motion.div
                key="usuarios"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Search control */}
                <div className="flex justify-between items-center gap-4">
                  <div className="relative max-w-xs w-full">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-450">
                      <Search className="w-4.5 h-4.5 text-fluid-blue" />
                    </div>
                    <input
                      type="text"
                      value={termoBusca}
                      onChange={e => setTermoBusca(e.target.value)}
                      placeholder="Filtrar por nome ou e-mail..."
                      className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue transition-all"
                    />
                  </div>
                </div>

                {/* Users Table Grid */}
                <div className="overflow-x-auto rounded-2xl border border-slate-150/10 dark:border-slate-800 bg-white/30 dark:bg-slate-900/10">
                  <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/40">
                      <tr>
                        <th scope="col" className="px-6 py-4.5 text-left text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Colaborador</th>
                        <th scope="col" className="px-6 py-4.5 text-left text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cargo/Função</th>
                        <th scope="col" className="px-6 py-4.5 text-left text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Acesso</th>
                        <th scope="col" className="px-6 py-4.5 text-left text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Status</th>
                        <th scope="col" className="relative px-6 py-4.5"><span className="sr-only">Ações</span></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-850 divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                      {usuariosFiltrados.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/30 transition-all group">
                          
                          {/* Profile */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fluid-blue/10 to-fluid-deep/10 text-fluid-blue flex items-center justify-center font-extrabold text-sm border border-fluid-blue/10">
                                {u.nome.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{u.nome}</h4>
                                <p className="text-[10px] text-slate-450 dark:text-slate-400 font-semibold mt-0.5">{u.email}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role tag */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-extrabold tracking-wide uppercase ${
                              u.funcao === 'admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/25 dark:text-purple-400 border border-purple-200/20'
                                : 'bg-slate-100 text-slate-650 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/10'
                            }`}>
                              {u.funcao === 'admin' ? 'Administrador' : 'Colaborador'}
                            </span>
                          </td>

                          {/* Groups list */}
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {u.grupos.map(g => (
                                <span key={g} className="px-2 py-0.5 rounded bg-fluid-light/50 dark:bg-fluid-blue/10 border border-fluid-blue/10 text-fluid-blue dark:text-fluid-light text-[9px] font-bold uppercase">
                                  {g}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {u.status === 'ativo' ? (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-fluid-success">
                                <UserCheck className="w-4.5 h-4.5" />
                                Ativo
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500 animate-pulse">
                                <ShieldAlert className="w-4.5 h-4.5" />
                                Pendente
                              </div>
                            )}
                          </td>

                          {/* Menu Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button className="text-slate-450 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer">
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* TAB 2: ACCESS GROUPS */}
            {abaAtiva === 'grupos' && (
              <motion.div
                key="grupos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {gruposAcesso.map(grupo => (
                  <div 
                    key={grupo.id} 
                    className="border border-slate-200/80 dark:border-slate-800/60 rounded-3xl p-5 hover:border-fluid-blue dark:hover:border-fluid-blue hover:shadow-lg transition-all bg-white dark:bg-slate-850 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-fluid-blue/10 flex items-center justify-center text-fluid-blue shadow-inner">
                          <ShieldCheck className="w-5.5 h-5.5" />
                        </div>
                        
                        {/* Lock / Exclusion */}
                        {grupo.id !== 'geral' && grupo.id !== 'admin' ? (
                          <button 
                            onClick={() => removerGrupoAcesso(grupo.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                            title="Excluir grupo"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        ) : (
                          <Lock className="w-4 h-4 text-slate-350 dark:text-slate-600 mr-2" />
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-slate-850 dark:text-white">
                        {grupo.nome}
                      </h3>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 font-extrabold uppercase mt-1">
                        Código do grupo: <span className="font-mono text-fluid-blue">{grupo.id}</span>
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-455 font-bold uppercase tracking-wide">
                      <span className="text-[10px] font-extrabold text-fluid-success bg-fluid-success/5 border border-fluid-success/15 px-2 py-0.5 rounded-lg">
                        Mapeado
                      </span>
                      <span>
                        {usuarios.filter(u => u.grupos.includes(grupo.id)).length} Colaboradores
                      </span>
                    </div>
                  </div>
                ))}

                {/* Add new group quickcard */}
                <div 
                  onClick={() => setModalGrupoAberto(true)}
                  className="border-2 border-dashed border-slate-200/80 hover:border-fluid-blue dark:border-slate-700/60 dark:hover:border-fluid-blue rounded-3xl p-5 flex flex-col items-center justify-center text-slate-450 dark:text-slate-500 hover:text-fluid-blue transition-all cursor-pointer min-h-[175px]"
                >
                  <Plus className="w-8 h-8 mb-2" />
                  <span className="text-xs uppercase font-extrabold tracking-wider">Criar Novo Grupo</span>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* NEW ACCESS GROUP MODAL */}
      <AnimatePresence>
        {modalGrupoAberto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalGrupoAberto(false)}
              className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative max-w-md w-full bg-white dark:bg-slate-850 rounded-3xl shadow-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 z-10"
            >
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Shield className="w-5 h-5 text-fluid-blue" />
                  Criar Grupo de Acesso
                </h3>
                <button
                  onClick={() => setModalGrupoAberto(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {erroGrupo && (
                <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200/20 text-red-650 dark:text-red-400 text-xs font-semibold rounded-xl">
                  {erroGrupo}
                </div>
              )}

              <form onSubmit={lidarCriarGrupo} className="space-y-4">
                
                {/* Group Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Nome do Grupo
                  </label>
                  <input
                    type="text"
                    required
                    value={nomeNovoGrupo}
                    onChange={e => setNomeNovoGrupo(e.target.value)}
                    placeholder="Ex: Recursos Humanos"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue"
                  />
                </div>

                {/* Group ID / Token */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-extrabold text-slate-550 dark:text-slate-400 uppercase tracking-widest block">
                    Código do Grupo
                  </label>
                  <input
                    type="text"
                    required
                    value={idNovoGrupo}
                    onChange={e => setIdNovoGrupo(e.target.value)}
                    placeholder="Ex: rh"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-fluid-blue/20 focus:border-fluid-blue"
                  />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalGrupoAberto(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold uppercase text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-fluid-blue hover:bg-fluid-deep text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-fluid-blue/15 cursor-pointer"
                  >
                    Salvar Grupo
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
