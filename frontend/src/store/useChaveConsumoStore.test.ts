import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { useChaveConsumoStore } from './useChaveConsumoStore';
import { fontesConsumoStore } from './useFontesDadosStore';
import { consumoStore } from './useConsumoStore';
import { buscaStore } from './useBuscaStore';
import { api } from '../services/api';

afterEach(() => { useAutenticacaoStore.getState().sair(); useChaveConsumoStore.getState().limpar(); vi.unstubAllGlobals(); });

describe('chave usada no módulo de consumo', () => {
  it('guarda a chave em memória e a descarta ao trocar a conta ou sair', () => {
    const salvar = vi.fn(); vi.stubGlobal('localStorage', { setItem: salvar });
    useAutenticacaoStore.getState().entrar({ id: '1', nome: 'A', email: 'a@example.com' }, 'jwt-a');
    useChaveConsumoStore.getState().usar(' chave-ficticia ');
    expect(useChaveConsumoStore.getState().chave).toBe('chave-ficticia');
    expect(salvar).not.toHaveBeenCalled();
    useAutenticacaoStore.getState().entrar({ id: '2', nome: 'B', email: 'b@example.com' }, 'jwt-b');
    expect(useChaveConsumoStore.getState().chave).toBe('');
    useChaveConsumoStore.getState().usar('outra-chave-ficticia');
    useAutenticacaoStore.getState().sair();
    expect(useChaveConsumoStore.getState().chave).toBe('');
  });
  it('limpa dados de consumo ao trocar a chave e descarta uma pesquisa atrasada', async () => {
    useAutenticacaoStore.getState().entrar({ id: '1', nome: 'A', email: 'a@example.com' }, 'jwt-a');
    useChaveConsumoStore.getState().usar('chave-ficticia');
    let resolver!: (resposta: Response) => void;
    vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(resolve => { resolver = resolve; })));
    const pesquisa = buscaStore.getState().pesquisar('manual', [{ id: '12', nome: 'Manual' }]);
    fontesConsumoStore.setState({ erroLeitura: 'Erro anterior' });
    consumoStore.setState({ erroLeitura: 'Erro anterior' });
    useChaveConsumoStore.getState().usar('outra-chave-ficticia');
    resolver(Response.json({ dados: [] })); await pesquisa;
    expect(buscaStore.getState().pesquisa).toBeNull();
    expect(fontesConsumoStore.getState().erroLeitura).toBe('');
    expect(consumoStore.getState().erroLeitura).toBe('');
  });
  it('recusa consumo sem chave antes de fazer a requisição', async () => {
    const buscar = vi.fn(); vi.stubGlobal('fetch', buscar);
    useChaveConsumoStore.getState().limpar();
    await expect(api.pesquisarDocumentos('manual', [12])).rejects.toThrow('chave de API');
    expect(buscar).not.toHaveBeenCalled();
  });
});
