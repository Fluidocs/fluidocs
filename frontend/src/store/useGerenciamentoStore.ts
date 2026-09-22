import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { Usuario } from './useAutenticacaoStore';

export const CHAVE_GERENCIAMENTO = 'fluidocs:gerenciamento-demo:v1';

interface Registro {
  id: string;
  conta: string;
  nome: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FonteDados extends Registro { descricao: string }
export interface ChaveApi extends Registro { final: string }
interface DadosLocais { fontes: FonteDados[]; chaves: ChaveApi[] }
export interface ArmazenamentoLocal {
  getItem: (chave: string) => string | null;
  setItem: (chave: string, valor: string) => void;
}

interface EstadoGerenciamento extends DadosLocais {
  erroLeitura: string;
  carregar: () => void;
  salvarFonte: (conta: string, dados: { nome: string; descricao: string }, id?: string) => FonteDados;
  excluirFonte: (conta: string, id: string) => void;
  criarChave: (conta: string, nome: string) => { registro: ChaveApi; valor: string };
  renomearChave: (conta: string, id: string, nome: string) => void;
  excluirChave: (conta: string, id: string) => void;
}

// O login de demonstração reutiliza o mesmo ID: o e-mail distingue as contas locais.
// Esta separação de interface não substitui autorização no backend.
export function identificarConta(usuario: Pick<Usuario, 'id' | 'email'>) {
  return JSON.stringify([usuario.id, usuario.email.trim().toLocaleLowerCase('pt-BR')]);
}

function validarNome(nome: string, registros: Registro[], conta: string, id?: string) {
  const limpo = nome.trim().replace(/\s+/g, ' ');
  if (!conta) throw new Error('Entre novamente para gerenciar os recursos da sua conta.');
  if (!limpo) throw new Error('Informe um nome.');
  if (limpo.length > 80) throw new Error('Use um nome com até 80 caracteres.');
  if (registros.some(r => r.conta === conta && r.id !== id && r.nome.toLocaleLowerCase('pt-BR') === limpo.toLocaleLowerCase('pt-BR'))) {
    throw new Error('Este nome já está em uso. Escolha outro nome.');
  }
  return limpo;
}

function encontrar<T extends Registro>(registros: T[], conta: string, id: string): T {
  const registro = registros.find(r => r.id === id && r.conta === conta);
  if (!registro) throw new Error('Este cadastro não está mais disponível. Atualize a lista e tente novamente.');
  return registro;
}

function registroValido(valor: unknown): valor is Registro {
  if (!valor || typeof valor !== 'object') return false;
  const r = valor as Record<string, unknown>;
  return ['id', 'conta', 'nome', 'criadoEm', 'atualizadoEm'].every(c => typeof r[c] === 'string')
    && Number.isFinite(Date.parse(r.criadoEm as string)) && Number.isFinite(Date.parse(r.atualizadoEm as string));
}

function lerDados(storage: ArmazenamentoLocal): DadosLocais {
  const texto = storage.getItem(CHAVE_GERENCIAMENTO);
  if (!texto) return { fontes: [], chaves: [] };
  const dados = JSON.parse(texto);
  if (!dados || !Array.isArray(dados.fontes) || !Array.isArray(dados.chaves)
    || !dados.fontes.every((r: unknown) => registroValido(r) && typeof (r as FonteDados).descricao === 'string')
    || !dados.chaves.every((r: unknown) => registroValido(r) && typeof (r as ChaveApi).final === 'string')) {
    throw new Error('Dados locais inválidos.');
  }
  return dados;
}

export function criarStoreGerenciamento(obterStorage: () => ArmazenamentoLocal) {
  const store = createStore<EstadoGerenciamento>((set, get) => {
    function persistir(dados: DadosLocais) {
      if (get().erroLeitura) throw new Error('Não foi possível ler os cadastros salvos. Tente carregar os dados novamente.');
      try { obterStorage().setItem(CHAVE_GERENCIAMENTO, JSON.stringify(dados)); }
      catch { throw new Error('Não foi possível salvar neste navegador. Verifique o espaço e a permissão de armazenamento e tente novamente.'); }
      // Só confirma a operação em memória depois de salvar com sucesso.
      set(dados);
    }
    return {
      fontes: [], chaves: [], erroLeitura: '',
      carregar: () => {
        try { set({ ...lerDados(obterStorage()), erroLeitura: '' }); }
        catch { set({ erroLeitura: 'Não foi possível carregar os cadastros deste navegador. Os dados salvos foram preservados.' }); }
      },
      salvarFonte: (conta, dados, id) => {
        const { fontes, chaves } = get();
        const nome = validarNome(dados.nome, fontes, conta, id);
        const descricao = dados.descricao.trim();
        if (descricao.length > 240) throw new Error('Use uma descrição com até 240 caracteres.');
        const anterior = id ? encontrar(fontes, conta, id) : undefined;
        const agora = new Date().toISOString();
        const registro: FonteDados = { id: anterior?.id ?? crypto.randomUUID(), conta, nome, descricao, criadoEm: anterior?.criadoEm ?? agora, atualizadoEm: agora };
        persistir({ fontes: anterior ? fontes.map(r => r.id === id && r.conta === conta ? registro : r) : [registro, ...fontes], chaves });
        return registro;
      },
      excluirFonte: (conta, id) => {
        const { fontes, chaves } = get();
        encontrar(fontes, conta, id);
        persistir({ fontes: fontes.filter(r => !(r.id === id && r.conta === conta)), chaves });
      },
      criarChave: (conta, entrada) => {
        const { fontes, chaves } = get();
        const nome = validarNome(entrada, chaves, conta);
        const bytes = crypto.getRandomValues(new Uint8Array(24));
        // Prefixo inequívoco de demonstração: não representa credencial real.
        const valor = `fd_demo_${Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')}`;
        const agora = new Date().toISOString();
        const registro: ChaveApi = { id: crypto.randomUUID(), conta, nome, final: valor.slice(-4), criadoEm: agora, atualizadoEm: agora };
        persistir({ fontes, chaves: [registro, ...chaves] });
        // O valor completo é entregue uma vez e nunca entra no store ou localStorage.
        return { registro, valor };
      },
      renomearChave: (conta, id, entrada) => {
        const { fontes, chaves } = get();
        encontrar(chaves, conta, id);
        const nome = validarNome(entrada, chaves, conta, id);
        persistir({ fontes, chaves: chaves.map(r => r.id === id && r.conta === conta ? { ...r, nome, atualizadoEm: new Date().toISOString() } : r) });
      },
      excluirChave: (conta, id) => {
        const { fontes, chaves } = get();
        encontrar(chaves, conta, id);
        persistir({ fontes, chaves: chaves.filter(r => !(r.id === id && r.conta === conta)) });
      },
    };
  });
  return store;
}

export const gerenciamentoStore = criarStoreGerenciamento(() => window.localStorage);
export function useGerenciamentoStore<T>(seletor: (estado: EstadoGerenciamento) => T) {
  return useStore(gerenciamentoStore, seletor);
}
