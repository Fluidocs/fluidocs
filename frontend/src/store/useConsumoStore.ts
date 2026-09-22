import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { ArmazenamentoLocal, FonteDados } from './useGerenciamentoStore';
import { responderExemplo, validarFontes, validarPergunta, type DocumentoDemo, type FonteConsulta } from '../services/consumoDemo';

export const CHAVE_CONSUMO = 'prisma-norte:conversas-demo:v1';
export interface MensagemConsumo {
  id: string;
  papel: 'usuario' | 'assistente';
  conteudo: string;
  criadoEm: string;
  evidencias: DocumentoDemo[];
}
export interface ConversaConsumo {
  id: string;
  conta: string;
  titulo: string;
  fontes: FonteConsulta[];
  mensagens: MensagemConsumo[];
  criadoEm: string;
  atualizadoEm: string;
}
interface EstadoConsumo {
  conversas: ConversaConsumo[];
  erroLeitura: string;
  carregar: () => void;
  iniciar: (conta: string, fontes: FonteDados[], ids: string[], pergunta: string) => string;
  enviar: (conta: string, id: string, fontes: FonteDados[], pergunta: string) => void;
  renomear: (conta: string, id: string, titulo: string) => void;
  excluir: (conta: string, id: string) => void;
}

function mensagens(pergunta: string, fontes: FonteConsulta[]): MensagemConsumo[] {
  const criadoEm = new Date().toISOString();
  const resposta = responderExemplo(pergunta, fontes);
  return [
    { id: crypto.randomUUID(), papel: 'usuario', conteudo: pergunta, criadoEm, evidencias: [] },
    { id: crypto.randomUUID(), papel: 'assistente', ...resposta, criadoEm },
  ];
}

function conversaValida(valor: unknown): valor is ConversaConsumo {
  if (!valor || typeof valor !== 'object') return false;
  const c = valor as ConversaConsumo;
  return ['id', 'conta', 'titulo', 'criadoEm', 'atualizadoEm'].every(k => typeof c[k] === 'string')
    && Number.isFinite(Date.parse(c.criadoEm)) && Number.isFinite(Date.parse(c.atualizadoEm))
    && Array.isArray(c.fontes) && c.fontes.length > 0 && c.fontes.every(f => f && typeof f.id === 'string' && typeof f.nome === 'string')
    && Array.isArray(c.mensagens) && c.mensagens.every(m => m && typeof m.id === 'string' && typeof m.conteudo === 'string'
      && ['usuario', 'assistente'].includes(m.papel) && Number.isFinite(Date.parse(m.criadoEm))
      && Array.isArray(m.evidencias) && m.evidencias.every(d => d && ['id', 'fonteId', 'fonteNome', 'nome', 'titulo', 'trecho'].every(k => typeof d[k] === 'string')));
}

export function criarStoreConsumo(obterStorage: () => ArmazenamentoLocal) {
  return createStore<EstadoConsumo>((set, get) => {
    function obter(conta: string, id: string) {
      const conversa = get().conversas.find(c => c.conta === conta && c.id === id);
      if (!conversa) throw new Error('Esta conversa não está mais disponível. Selecione outra ou inicie uma nova.');
      return conversa;
    }
    function salvar(conversas: ConversaConsumo[]) {
      if (get().erroLeitura) throw new Error('Carregue novamente o histórico antes de continuar.');
      try { obterStorage().setItem(CHAVE_CONSUMO, JSON.stringify(conversas)); }
      catch { throw new Error('Não foi possível salvar a conversa neste navegador. Confira o espaço e a permissão de armazenamento e tente novamente.'); }
      set({ conversas });
    }
    return {
      conversas: [], erroLeitura: '',
      carregar: () => {
        try {
          const texto = obterStorage().getItem(CHAVE_CONSUMO);
          const dados: unknown = texto ? JSON.parse(texto) : [];
          if (!Array.isArray(dados) || !dados.every(conversaValida)) throw new Error('Histórico inválido');
          set({ conversas: dados, erroLeitura: '' });
        } catch { set({ erroLeitura: 'Não foi possível carregar as conversas salvas. O histórico deste navegador foi preservado.' }); }
      },
      iniciar: (conta, fontes, ids, entrada) => {
        const fontesFixas = validarFontes(conta, fontes, ids);
        const pergunta = validarPergunta(entrada);
        const agora = new Date().toISOString();
        const conversa: ConversaConsumo = { id: crypto.randomUUID(), conta, titulo: pergunta.slice(0, 80), fontes: fontesFixas, mensagens: mensagens(pergunta, fontesFixas), criadoEm: agora, atualizadoEm: agora };
        salvar([conversa, ...get().conversas]);
        return conversa.id;
      },
      enviar: (conta, id, fontes, entrada) => {
        const conversa = obter(conta, id);
        validarFontes(conta, fontes, conversa.fontes.map(f => f.id));
        const pergunta = validarPergunta(entrada);
        const atualizada = { ...conversa, mensagens: [...conversa.mensagens, ...mensagens(pergunta, conversa.fontes)], atualizadoEm: new Date().toISOString() };
        salvar([atualizada, ...get().conversas.filter(c => !(c.id === id && c.conta === conta))]);
      },
      renomear: (conta, id, entrada) => {
        obter(conta, id);
        const titulo = entrada.trim();
        if (!titulo || titulo.length > 80) throw new Error('Use um título entre 1 e 80 caracteres.');
        salvar(get().conversas.map(c => c.id === id && c.conta === conta ? { ...c, titulo } : c));
      },
      excluir: (conta, id) => {
        obter(conta, id);
        salvar(get().conversas.filter(c => !(c.id === id && c.conta === conta)));
      },
    };
  });
}

export const consumoStore = criarStoreConsumo(() => window.localStorage);
export function useConsumoStore<T>(seletor: (estado: EstadoConsumo) => T) { return useStore(consumoStore, seletor); }
