import { create } from 'zustand';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcao?: 'admin' | 'funcionario';
  gruposAcesso?: string[];
}

interface EstadoAutenticacao {
  usuario: Usuario | null;
  tokenAcesso: string | null;
  estaAutenticado: boolean;
  entrar: (usuario: Usuario, tokenAcesso?: string) => void;
  sair: () => void;
}

export const CHAVE_SESSAO = 'fluidocs-token-acesso';

type ArmazenamentoSessao = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function criarStoreAutenticacao(
  obterArmazenamento: () => ArmazenamentoSessao = () => globalThis.sessionStorage,
) {
  let tokenInicial: string | null = null;
  try {
    tokenInicial = obterArmazenamento()?.getItem(CHAVE_SESSAO) || null;
  } catch {
    // Sem armazenamento disponível, a sessão funciona apenas em memória.
  }

  return create<EstadoAutenticacao>((set) => ({
    usuario: null,
    tokenAcesso: tokenInicial,
    estaAutenticado: false,
    entrar: (usuario, tokenAcesso) => {
      try {
        const armazenamento = obterArmazenamento();
        if (tokenAcesso) armazenamento?.setItem(CHAVE_SESSAO, tokenAcesso);
        else armazenamento?.removeItem(CHAVE_SESSAO);
      } catch {
        // Bloqueio do sessionStorage não impede o login nesta página.
      }
      set({ usuario, tokenAcesso: tokenAcesso || null, estaAutenticado: true });
    },
    sair: () => {
      try {
        obterArmazenamento()?.removeItem(CHAVE_SESSAO);
      } catch {
        // A sessão em memória é encerrada mesmo com o armazenamento bloqueado.
      }
      set({ usuario: null, tokenAcesso: null, estaAutenticado: false });
    },
  }));
}

export const useAutenticacaoStore = criarStoreAutenticacao();
