import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };
const chave = { id: 12, nome: 'Portal', descricao: 'Integração de teste' };
const token = 'chave-api-ficticia-para-testes';

describe('contrato HTTP das chaves de API', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    useAutenticacaoStore.getState().entrar(usuario, 'jwt-ficticio');
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    useAutenticacaoStore.getState().sair();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('lista os metadados pela rota de gerenciamento com o JWT da conta', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: [chave], meta: { tempo_execucao: 0 } }));
    expect(await api.listarChavesApi()).toEqual([chave]);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/chaves-api');
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-ficticio');
    expect(opcoes.credentials).toBe('include');
  });

  it('mantém a lista vazia do backend e descarta campos de segredo inesperados', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ dados: [] }));
    expect(await api.listarChavesApi()).toEqual([]);
    fetchMock.mockResolvedValueOnce(Response.json({ dados: [{ ...chave, token }] }));
    expect(await api.listarChavesApi()).toEqual([chave]);
  });

  it('cria pelo POST real, com nome e descrição, e entrega o token da resposta', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: { ...chave, token } }, { status: 201 }));
    expect(await api.criarChaveApi({ nome: ' Portal ', descricao: ' Integração de teste ' })).toEqual({ ...chave, token });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/chaves-api');
    expect(opcoes.method).toBe('POST');
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-ficticio');
    expect(new Headers(opcoes.headers).get('Content-Type')).toBe('application/json');
    expect(JSON.parse(opcoes.body as string)).toEqual({ nome: chave.nome, descricao: chave.descricao });
  });

  it('envia descrição vazia como null e aceita os limites exatos do schema', async () => {
    fetchMock.mockImplementation(async () => Response.json({ dados: { ...chave, token } }, { status: 201 }));
    await api.criarChaveApi({ nome: 'Portal', descricao: '   ' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body as string)).toEqual({ nome: 'Portal', descricao: null });
    await api.criarChaveApi({ nome: 'a'.repeat(60), descricao: 'b'.repeat(255) });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('recusa nome em branco e dados acima dos limites antes de enviar a requisição', async () => {
    await expect(api.criarChaveApi({ nome: '   ' })).rejects.toThrow('Informe um nome');
    await expect(api.criarChaveApi({ nome: 'a'.repeat(61) })).rejects.toThrow('60 caracteres');
    await expect(api.criarChaveApi({ nome: 'Portal', descricao: 'a'.repeat(256) })).rejects.toThrow('255 caracteres');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga limite de chaves e erro de conexão sem gerar uma chave local', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'Limite de chaves de API atingido.' }, { status: 409 }));
    await expect(api.criarChaveApi({ nome: 'Portal' })).rejects.toMatchObject({
      status: 409, mensagem: 'Limite de chaves de API atingido.',
    });
    fetchMock.mockRejectedValueOnce(new TypeError('Conexão indisponível'));
    await expect(api.criarChaveApi({ nome: 'Portal' })).rejects.toMatchObject({ status: 0 });
  });

  it('preserva a renomeação pelo PATCH, sem enviar nem retornar o token', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: { ...chave, nome: 'Portal interno', token } }));
    expect(await api.renomearChaveApi(12, ' Portal interno ')).toEqual({ ...chave, nome: 'Portal interno' });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/chaves-api/12');
    expect(opcoes.method).toBe('PATCH');
    expect(JSON.parse(opcoes.body as string)).toEqual({ nome: 'Portal interno' });
  });

  it('exclui o ID retornado pelo backend por DELETE autenticado', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: chave }));
    await expect(api.excluirChaveApi(chave.id)).resolves.toBeUndefined();
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/chaves-api/12');
    expect(opcoes.method).toBe('DELETE');
    expect(opcoes.body).toBeUndefined();
    expect(new Headers(opcoes.headers).get('Authorization')).toBe('Bearer jwt-ficticio');
  });

  it('propaga a exclusão rejeitada sem informar sucesso', async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: 'Chave de API nao encontrada.' }, { status: 404 }));
    await expect(api.excluirChaveApi(chave.id)).rejects.toMatchObject({ status: 404 });
  });

  it('encerra a sessão quando o JWT é rejeitado na listagem', async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: 'Token invalido.' }, { status: 401 }));
    await expect(api.listarChavesApi()).rejects.toMatchObject({ status: 401 });
    expect(useAutenticacaoStore.getState()).toMatchObject({ usuario: null, tokenAcesso: null, estaAutenticado: false });
  });

  it.each(['https://api.example.com/api', 'https://api.example.com/api/'])(
    'usa a raiz do backend quando VITE_API_URL é %s', async baseUrl => {
      vi.stubEnv('VITE_API_URL', baseUrl);
      vi.resetModules();
      const { api: cliente } = await import('./api');
      const { useAutenticacaoStore: sessao } = await import('../store/useAutenticacaoStore');
      sessao.getState().entrar(usuario, 'jwt-outra-conta-ficticio');
      fetchMock.mockResolvedValue(Response.json({ dados: [chave] }));
      await cliente.listarChavesApi();
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/chaves-api');
      expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer jwt-outra-conta-ficticio');
      sessao.getState().sair();
    },
  );
});
