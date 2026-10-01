import { describe, expect, it } from 'vitest';
import { CHAVE_SESSAO, criarStoreAutenticacao } from './useAutenticacaoStore';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };

function armazenamentoEmMemoria() {
  const valores = new Map<string, string>();
  return {
    getItem: (chave: string) => valores.get(chave) ?? null,
    setItem: (chave: string, valor: string) => { valores.set(chave, valor); },
    removeItem: (chave: string) => { valores.delete(chave); },
  };
}

describe('sessão de autenticação', () => {
  it('mantém apenas o token no sessionStorage e aguarda /me para autenticar após recarregar', () => {
    const armazenamento = armazenamentoEmMemoria();
    const store = criarStoreAutenticacao(() => armazenamento);
    store.getState().entrar(usuario, 'token-ficticio');
    expect(armazenamento.getItem(CHAVE_SESSAO)).toBe('token-ficticio');
    const recarregado = criarStoreAutenticacao(() => armazenamento);
    expect(recarregado.getState()).toMatchObject({ tokenAcesso: 'token-ficticio', usuario: null, estaAutenticado: false });
    recarregado.getState().entrar(usuario, 'token-ficticio');
    recarregado.getState().sair();
    expect(armazenamento.getItem(CHAVE_SESSAO)).toBeNull();
    expect(recarregado.getState()).toMatchObject({ tokenAcesso: null, usuario: null, estaAutenticado: false });
  });

  it('abre a demonstração sem reutilizar nem persistir um token real', () => {
    const armazenamento = armazenamentoEmMemoria();
    const store = criarStoreAutenticacao(() => armazenamento);
    store.getState().entrar(usuario, 'token-ficticio');
    store.getState().entrar({ id: 'demo', nome: 'Demonstração', email: 'demo@example.com' });
    expect(store.getState()).toMatchObject({ tokenAcesso: null, estaAutenticado: true });
    expect(armazenamento.getItem(CHAVE_SESSAO)).toBeNull();
    expect(criarStoreAutenticacao(() => armazenamento).getState().estaAutenticado).toBe(false);
  });

  it('permite entrar e sair em memória quando o navegador bloqueia o armazenamento', () => {
    const store = criarStoreAutenticacao(() => { throw new Error('Armazenamento bloqueado'); });
    expect(() => store.getState().entrar(usuario, 'token-ficticio')).not.toThrow();
    expect(store.getState().estaAutenticado).toBe(true);
    expect(() => store.getState().sair()).not.toThrow();
    expect(store.getState().tokenAcesso).toBeNull();
  });
});
