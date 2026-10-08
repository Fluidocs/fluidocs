import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { useChaveConsumoStore } from '../store/useChaveConsumoStore';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };
const documento = {
  fonte_dados_id: 12, documento_id: 'arquivo-123', nome_documento: 'manual.pdf', pontuacao: 2.5,
  trechos: [{ id_trecho: 0, conteudo: 'Trecho retornado pela pesquisa.', pontuacao: 2.5 },
    { id_trecho: null, conteudo: null, pontuacao: 0 }],
};

describe('contrato HTTP da pesquisa do painel', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    useAutenticacaoStore.getState().entrar(usuario, 'jwt-ficticio');
    useChaveConsumoStore.getState().usar('chave-ficticia');
    fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => {
    useAutenticacaoStore.getState().sair(); vi.unstubAllGlobals(); vi.unstubAllEnvs();
  });

  it('envia POST na API pública com chave, fontes únicas e paginação híbrida', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: [documento], paginacao: { total: 15, pagina: 2, por_pagina: 10, paginas: 2 } }));
    expect(await api.pesquisarDocumentos('  manual  ', [12, 13, 12], 2)).toEqual({
      resultados: [documento], total: 15, pagina: 2, tamanho: 10, paginas_totais: 2,
    });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/pesquisar');
    expect(opcoes.method).toBe('POST');
    expect(new Headers(opcoes.headers).has('Authorization')).toBe(false);
    expect(new Headers(opcoes.headers).get('X-API-Key')).toBe('chave-ficticia');
    expect(JSON.parse(opcoes.body as string)).toEqual({
      q: 'manual', fonte_dados_ids: [12, 13], tipo_pesquisa: 'hibrida', pagina: 2, tamanho: 10,
    });
  });

  it('aceita resultado vazio sem inserir documentos de demonstração', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: [], paginacao: { total: 0, pagina: 1, por_pagina: 10, paginas: 0 } }));
    expect(await api.pesquisarDocumentos('ausente', [12])).toMatchObject({ resultados: [], total: 0 });
  });
  it('lista as fontes pela mesma chave da API pública', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ dados: [] }));
    expect(await api.listarFontesConsumo()).toEqual([]);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/fontes-dados/');
    expect(new Headers(opcoes.headers).get('X-API-Key')).toBe('chave-ficticia');
    expect(new Headers(opcoes.headers).has('Authorization')).toBe(false);
  });
  it('não descarta a nova chave por uma rejeição atrasada da chave anterior', async () => {
    fetchMock.mockImplementationOnce(async () => {
      useChaveConsumoStore.getState().usar('nova-chave-ficticia');
      return Response.json({ detail: 'Chave inválida.' }, { status: 401 });
    });
    await expect(api.pesquisarDocumentos('manual', [12])).rejects.toMatchObject({ status: 401 });
    expect(useChaveConsumoStore.getState().chave).toBe('nova-chave-ficticia');
  });

  it('valida consulta, fontes e página antes de enviar', async () => {
    for (const [termo, fontes, pagina] of [
      ['', [12], 1], ['a'.repeat(2001), [12], 1], ['manual', [], 1],
      ['manual', [0], 1], ['manual', [NaN], 1], ['manual', [1.5], 1], ['manual', [12], 0],
    ] as Array<[string, number[], number]>) {
      await expect(api.pesquisarDocumentos(termo, fontes, pagina)).rejects.toBeInstanceOf(Error);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga a indisponibilidade e preserva o login quando a chave é rejeitada', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ mensagem: 'Motor de pesquisa indisponível.' }, { status: 503 }));
    await expect(api.pesquisarDocumentos('manual', [12])).rejects.toMatchObject({ status: 503, mensagem: 'Motor de pesquisa indisponível.' });
    fetchMock.mockRejectedValueOnce(new TypeError('Sem conexão'));
    await expect(api.pesquisarDocumentos('manual', [12])).rejects.toMatchObject({ status: 0 });
    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'Token inválido.' }, { status: 401 }));
    await expect(api.pesquisarDocumentos('manual', [12])).rejects.toMatchObject({ status: 401 });
    expect(useAutenticacaoStore.getState().tokenAcesso).toBe('jwt-ficticio');
    expect(useChaveConsumoStore.getState().chave).toBe('');
  });

  it.each(['https://api.example.com/api', 'https://api.example.com/api/'])(
    'resolve a rota autenticada com VITE_API_URL=%s', async baseUrl => {
      vi.stubEnv('VITE_API_URL', baseUrl); vi.resetModules();
      const { api: cliente } = await import('./api');
      const { useAutenticacaoStore: sessao } = await import('../store/useAutenticacaoStore');
      sessao.getState().entrar(usuario, 'jwt-ficticio');
      const { useChaveConsumoStore: chave } = await import('../store/useChaveConsumoStore');
      chave.getState().usar('chave-ficticia');
      fetchMock.mockResolvedValue(Response.json({ dados: [] }));
      await cliente.pesquisarDocumentos('manual', [12]);
      expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/v1/pesquisar');
      sessao.getState().sair();
    },
  );
});
