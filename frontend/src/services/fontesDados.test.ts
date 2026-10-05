import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };
const fonte = {
  id: 12, nome: 'RH', descricao: 'Políticas internas',
  data_criacao: '2026-10-05T12:00:00Z', data_atualizacao: '2026-10-05T12:00:00Z',
};

describe('contrato HTTP das fontes de dados', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    useAutenticacaoStore.getState().entrar(usuario, 'jwt-ficticio');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    useAutenticacaoStore.getState().sair();
    vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  it('lista fontes na raiz do backend com o JWT e preserva as datas retornadas', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ dados: [fonte], meta: { tempo_execucao: 0 } }));
    expect(await api.listarFontesDados()).toEqual([fonte]);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/fontes-dados/');
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-ficticio');
    expect(opcoes.credentials).toBe('include');
    fetchMock.mockResolvedValueOnce(Response.json({ dados: [] }));
    expect(await api.listarFontesDados()).toEqual([]);
  });

  it('cria com nome e descrição, sem campos de conta ou repositório legado', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: fonte }, { status: 201 }));
    expect(await api.criarFonteDados({ nome: ' RH ', descricao: ' Políticas internas ' })).toEqual(fonte);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/fontes-dados/');
    expect(opcoes.method).toBe('POST');
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-ficticio');
    expect(JSON.parse(opcoes.body as string)).toEqual({ nome: 'RH', descricao: 'Políticas internas' });
  });

  it('envia descrição vazia como string e aceita 100/250 caracteres', async () => {
    fetchMock.mockImplementation(async () => Response.json({ dados: fonte }, { status: 201 }));
    await api.criarFonteDados({ nome: 'RH', descricao: '  ' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ nome: 'RH', descricao: '' });
    await api.criarFonteDados({ nome: 'a'.repeat(100), descricao: 'b'.repeat(250) });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each(['criarFonteDados', 'atualizarFonteDados'] as const)('valida os campos antes de %s', async metodo => {
    const enviar = (nome: string, descricao = '') => metodo === 'criarFonteDados'
      ? api.criarFonteDados({ nome, descricao }) : api.atualizarFonteDados(12, { nome, descricao });
    await expect(enviar('   ')).rejects.toThrow('Informe um nome');
    await expect(enviar('a'.repeat(101))).rejects.toThrow('100 caracteres');
    await expect(enviar('RH', 'a'.repeat(251))).rejects.toThrow('250 caracteres');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('edita pelo PATCH e permite limpar a descrição', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: { ...fonte, nome: 'Recursos Humanos', descricao: '' } }));
    expect(await api.atualizarFonteDados(12, { nome: ' Recursos Humanos ', descricao: ' ' })).toMatchObject({ id: 12, nome: 'Recursos Humanos', descricao: '' });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/fontes-dados/12');
    expect(opcoes.method).toBe('PATCH');
    expect(JSON.parse(opcoes.body as string)).toEqual({ nome: 'Recursos Humanos', descricao: '' });
  });

  it('aguarda o DELETE autenticado com resposta 202', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: fonte }, { status: 202 }));
    await expect(api.excluirFonteDados(12)).resolves.toBeUndefined();
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/fontes-dados/12');
    expect(opcoes.method).toBe('DELETE');
    expect(opcoes.body).toBeUndefined();
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-ficticio');
  });

  it('propaga rejeição e indisponibilidade sem informar sucesso', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'Fonte não encontrada.' }, { status: 404 }));
    await expect(api.excluirFonteDados(12)).rejects.toMatchObject({ status: 404 });
    fetchMock.mockRejectedValueOnce(new TypeError('Sem conexão'));
    await expect(api.listarFontesDados()).rejects.toMatchObject({ status: 0 });
  });

  it('encerra a sessão quando a API rejeita o JWT', async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: 'Token inválido.' }, { status: 401 }));
    await expect(api.listarFontesDados()).rejects.toMatchObject({ status: 401 });
    expect(useAutenticacaoStore.getState().tokenAcesso).toBeNull();
  });

  it.each(['https://api.example.com/api', 'https://api.example.com/api/'])(
    'usa a raiz da API para VITE_API_URL=%s', async baseUrl => {
      vi.stubEnv('VITE_API_URL', baseUrl); vi.resetModules();
      const { api: cliente } = await import('./api');
      const { useAutenticacaoStore: sessao } = await import('../store/useAutenticacaoStore');
      sessao.getState().entrar(usuario, 'jwt-ficticio');
      fetchMock.mockResolvedValue(Response.json({ dados: [fonte] }));
      await cliente.listarFontesDados();
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/fontes-dados/');
      sessao.getState().sair();
    },
  );
});
