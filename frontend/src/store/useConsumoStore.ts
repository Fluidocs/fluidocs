import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { api, extrairMensagemErro, type ConversaResumoBackend, type ConversaDetalheBackend, type AnexoConversaBackend } from '../services/api';
import { validarFontes, validarPergunta, type FonteConsulta } from '../services/consumoDemo';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { useChaveConsumoStore } from './useChaveConsumoStore';
import { identificarConta, type FonteDados } from './useGerenciamentoStore';

export interface EvidenciaConversa { id: string; nome: string; fonteNome: string; trecho: string | null }
export interface MensagemConsumo {
  id: string; papel: 'usuario' | 'assistente'; conteudo: string; criadoEm: string; evidencias: EvidenciaConversa[];
}
export interface ConversaConsumo {
  id: string; conta: string; titulo: string; fontes: FonteConsulta[]; mensagens: MensagemConsumo[];
  criadoEm: string; atualizadoEm: string; detalhada: boolean;
}
interface EstadoConsumo {
  conversas: ConversaConsumo[]; erroLeitura: string; carregando: boolean;
  detalhandoId: string | null; erroDetalhe: string; enviando: boolean; alterando: boolean;
  pagina: number; paginas: number;
  limpar: () => void;
  carregar: (mais?: boolean) => Promise<void>;
  detalhar: (id: string, recarregar?: boolean) => Promise<void>;
  iniciar: (conta: string, fontes: FonteDados[], ids: string[], pergunta: string) => Promise<string | undefined>;
  enviar: (conta: string, id: string, fontes: FonteDados[], pergunta: string, idsIniciais?: string[]) => Promise<boolean>;
  renomear: (conta: string, id: string, titulo: string) => Promise<boolean>;
  excluir: (conta: string, id: string) => Promise<boolean>;
}
type Cliente = Pick<typeof api, 'listarConversas' | 'obterConversa' | 'perguntarConversa' | 'renomearConversa' | 'excluirConversa'>;
type Sessao = Pick<ReturnType<typeof useAutenticacaoStore.getState>, 'usuario' | 'tokenAcesso'>;

function agruparEvidencias(anexos: AnexoConversaBackend[]): EvidenciaConversa[] {
  const arquivos = new Map<string, EvidenciaConversa>();
  for (const anexo of anexos) {
    const chave = anexo.nome;
    if (!arquivos.has(chave)) arquivos.set(chave, { id: String(anexo.id), nome: anexo.nome, trecho: null,
      fonteNome: 'Origem não informada pela API' });
  }
  return [...arquivos.values()];
}

export function normalizarConversaConsumo(dados: ConversaResumoBackend | ConversaDetalheBackend, conta: string, fontes: FonteConsulta[] = []): ConversaConsumo {
  return {
    id: String(dados.id), conta, titulo: dados.titulo.trim() || 'Nova conversa', fontes,
    criadoEm: dados.data_criacao, atualizadoEm: dados.data_ultima_interacao, detalhada: 'mensagens' in dados,
    mensagens: 'mensagens' in dados ? dados.mensagens.map(m => ({
      id: String(m.id), papel: m.papel === 'U' ? 'usuario' : 'assistente', conteudo: m.conteudo, criadoEm: m.data_envio,
      evidencias: agruparEvidencias(m.anexos),
    })) : [],
  };
}

type ArmazenamentoFontes = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function criarStoreConsumo(cliente: Cliente = api, obterSessao: () => Sessao = useAutenticacaoStore.getState,
  obterArmazenamento: () => ArmazenamentoFontes = () => globalThis.localStorage) {
  let revisao = 0, leitura = 0, detalhe = 0;
  return createStore<EstadoConsumo>((set, get) => {
    function chaveFontes(conta: string, id: string) { return `fluidocs-fontes-conversa:${conta}:${id}`; }
    function fontesSalvas(conta: string, id: string): FonteConsulta[] {
      const emMemoria = get().conversas.find(c => c.conta === conta && c.id === id)?.fontes;
      if (emMemoria?.length) return emMemoria;
      try {
        const fontes: unknown = JSON.parse(obterArmazenamento()?.getItem(chaveFontes(conta, id)) ?? '[]');
        return Array.isArray(fontes) && fontes.every(f => f && typeof f.id === 'string' &&
          /^[1-9]\d*$/.test(f.id) && typeof f.nome === 'string') ? fontes : [];
      } catch { return []; }
    }
    function salvarFontes(conta: string, id: string, fontes: FonteConsulta[]) {
      try { obterArmazenamento()?.setItem(chaveFontes(conta, id), JSON.stringify(fontes)); } catch { /* A aba mantém o escopo em memória. */ }
    }
    function contexto(contaEsperada?: string) {
      const { usuario, tokenAcesso } = obterSessao();
      if (!usuario || !tokenAcesso) throw new Error('Entre novamente para acessar suas conversas.');
      const conta = identificarConta(usuario), versao = revisao;
      if (contaEsperada && contaEsperada !== conta) throw new Error('Esta conversa pertence a outra conta.');
      return { conta, atual: () => {
        const sessao = obterSessao();
        return versao === revisao && sessao.tokenAcesso === tokenAcesso &&
          !!sessao.usuario && identificarConta(sessao.usuario) === conta;
      } };
    }
    function obter(conta: string, id: string) {
      const conversa = get().conversas.find(c => c.conta === conta && c.id === id);
      if (!conversa) throw new Error('Esta conversa não está mais disponível. Selecione outra ou inicie uma nova.');
      return conversa;
    }
    function atualizar(conversa: ConversaConsumo) {
      set({ conversas: [conversa, ...get().conversas.filter(c => c.id !== conversa.id)]
        .sort((a, b) => Date.parse(b.atualizadoEm) - Date.parse(a.atualizadoEm) || Number(b.id) - Number(a.id)) });
    }
    function comecar(enviando: boolean) {
      if (get().enviando || get().alterando) throw new Error('Aguarde a operação atual terminar.');
      leitura++; detalhe++;
      set({ carregando: false, detalhandoId: null, erroDetalhe: '',
        ...(enviando ? { enviando: true } : { alterando: true }) });
    }
    return {
      conversas: [], erroLeitura: '', carregando: false, detalhandoId: null, erroDetalhe: '',
      enviando: false, alterando: false, pagina: 0, paginas: 0,
      limpar: () => {
        revisao++; leitura++; detalhe++;
        set({ conversas: [], erroLeitura: '', carregando: false, detalhandoId: null, erroDetalhe: '',
          enviando: false, alterando: false, pagina: 0, paginas: 0 });
      },
      carregar: async (mais = false) => {
        if (get().enviando || get().alterando) return;
        const numero = ++leitura, ctx = contexto(), pagina = mais ? get().pagina + 1 : 1;
        const atual = () => ctx.atual() && numero === leitura;
        set({ carregando: true, erroLeitura: '' });
        try {
          const resposta = await cliente.listarConversas(pagina);
          if (!atual()) return;
          const novas = resposta.conversas.map(c => {
            const anterior = get().conversas.find(a => a.id === String(c.id) && a.conta === ctx.conta);
            return anterior?.detalhada && anterior.atualizadoEm === c.data_ultima_interacao
              ? { ...anterior, titulo: c.titulo.trim() || 'Nova conversa' }
              : normalizarConversaConsumo(c, ctx.conta, fontesSalvas(ctx.conta, String(c.id)));
          });
          set({ conversas: mais ? [...get().conversas.filter(c => !novas.some(n => n.id === c.id)), ...novas] : novas,
            pagina: resposta.pagina, paginas: resposta.paginas });
        } catch (erro) {
          if (atual()) set({ erroLeitura: extrairMensagemErro(erro, 'Não foi possível carregar suas conversas. Tente novamente.') });
        } finally { if (atual()) set({ carregando: false }); }
      },
      detalhar: async (id, recarregar = false) => {
        if (get().enviando || get().alterando) return;
        const ctx = contexto(), numero = ++detalhe;
        const atual = () => ctx.atual() && numero === detalhe;
        if (!recarregar && get().conversas.some(c => c.id === id && c.detalhada)) {
          set({ detalhandoId: null, erroDetalhe: '' });
          return;
        }
        set({ detalhandoId: id, erroDetalhe: '' });
        try {
          const resposta = await cliente.obterConversa(Number(id));
          if (atual()) atualizar(normalizarConversaConsumo(resposta, ctx.conta, fontesSalvas(ctx.conta, id)));
        } catch (erro) {
          if (atual()) set({ erroDetalhe: extrairMensagemErro(erro, 'Não foi possível carregar as mensagens. Tente novamente.') });
        } finally { if (atual()) set({ detalhandoId: null }); }
      },
      iniciar: async (conta, fontes, ids, entrada) => {
        const ctx = contexto(conta), escopo = validarFontes(conta, fontes, ids), pergunta = validarPergunta(entrada);
        comecar(true);
        try {
          const resposta = await cliente.perguntarConversa(pergunta, escopo.map(f => Number(f.id)));
          if (!ctx.atual()) return;
          salvarFontes(conta, String(resposta.id), escopo);
          atualizar(normalizarConversaConsumo(resposta, conta, escopo));
          return String(resposta.id);
        } finally { if (ctx.atual()) set({ enviando: false }); }
      },
      enviar: async (conta, id, fontes, entrada, idsIniciais = []) => {
        const ctx = contexto(conta), conversa = obter(conta, id);
        if (!conversa.detalhada) throw new Error('Carregue as mensagens antes de continuar.');
        if (!conversa.fontes.length && conversa.mensagens.length) throw new Error('Inicie outra conversa para selecionar suas fontes.');
        const escopo = validarFontes(conta, fontes, conversa.fontes.length ? conversa.fontes.map(f => f.id) : idsIniciais), pergunta = validarPergunta(entrada);
        comecar(true);
        try {
          const resposta = await cliente.perguntarConversa(pergunta, escopo.map(f => Number(f.id)), Number(id));
          if (!ctx.atual()) return false;
          const fontesFixas = conversa.fontes.length ? conversa.fontes : escopo;
          salvarFontes(conta, id, fontesFixas);
          atualizar(normalizarConversaConsumo(resposta, conta, fontesFixas));
          return true;
        } finally { if (ctx.atual()) set({ enviando: false }); }
      },
      renomear: async (conta, id, entrada) => {
        const ctx = contexto(conta);
        obter(conta, id);
        const titulo = entrada.trim();
        if (!titulo || titulo.length > 255) throw new Error('Use um título entre 1 e 255 caracteres.');
        comecar(false);
        try {
          const resposta = await cliente.renomearConversa(Number(id), titulo);
          if (!ctx.atual()) return false;
          set({ conversas: get().conversas.map(c => c.id === id ? { ...c, titulo: resposta.titulo } : c) });
          return true;
        } finally { if (ctx.atual()) set({ alterando: false }); }
      },
      excluir: async (conta, id) => {
        const ctx = contexto(conta);
        obter(conta, id);
        comecar(false);
        try {
          await cliente.excluirConversa(Number(id));
          if (!ctx.atual()) return false;
          try { obterArmazenamento()?.removeItem(chaveFontes(conta, id)); } catch { /* Limpeza local opcional. */ }
          set({ conversas: get().conversas.filter(c => c.id !== id) });
          return true;
        } finally { if (ctx.atual()) set({ alterando: false }); }
      },
    };
  });
}
export const consumoStore = criarStoreConsumo();
useChaveConsumoStore.subscribe((sessao, anterior) => {
  if (sessao.chave !== anterior.chave) consumoStore.getState().limpar();
});
useAutenticacaoStore.subscribe((sessao, anterior) => {
  if (sessao.tokenAcesso !== anterior.tokenAcesso || sessao.usuario?.id !== anterior.usuario?.id ||
      sessao.usuario?.email !== anterior.usuario?.email) consumoStore.getState().limpar();
});
export function useConsumoStore<T>(seletor: (estado: EstadoConsumo) => T) { return useStore(consumoStore, seletor); }
