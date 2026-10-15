import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { useChaveConsumoStore } from '../store/useChaveConsumoStore';

describe('contrato HTTP de conversas do painel', () => {
  const fetchMock = vi.fn<typeof fetch>();
  beforeEach(() => {
    useAutenticacaoStore.getState().entrar({ id: '1', nome: 'Conta', email: 'a@example.com' }, 'jwt-ficticio');
    useChaveConsumoStore.getState().usar('chave-ficticia');
    fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  });
  afterEach(() => { useAutenticacaoStore.getState().sair(); vi.unstubAllGlobals(); });

  it('envia a pergunta com API Key e carrega o detalhe usando o ID retornado', async () => {
    fetchMock.mockImplementation(async (_url, opcoes) => Response.json({ dados: opcoes?.method === 'POST'
      ? { conversa_id: 7, resposta: 'Resposta da API', anexos: [] } : { id: 7, mensagens: [] } }));
    await api.perguntarConversa('  manual  ', [12, 13, 12]);
    await api.perguntarConversa('Outra pergunta', [12, 13], 7);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/conversas/perguntar'); expect(opcoes.method).toBe('POST');
    expect(new Headers(opcoes.headers).has('Authorization')).toBe(false);
    expect(new Headers(opcoes.headers).get('X-API-Key')).toBe('chave-ficticia');
    expect(JSON.parse(opcoes.body as string)).toEqual({ pergunta: 'manual', fonte_dados_ids: [12, 13] });
    expect(fetchMock.mock.calls[1][0]).toBe('/api/v1/conversas/7');
    expect(JSON.parse(fetchMock.mock.calls[2][1].body as string)).toEqual({ pergunta: 'Outra pergunta', fonte_dados_ids: [12, 13], conversa_id: 7 });
  });
  it('lista páginas, obtém mensagens, renomeia e exclui pelas rotas reais', async () => {
    fetchMock.mockImplementation(async () => Response.json({ dados: [], paginacao: { pagina: 2, paginas: 3 } }));
    expect(await api.listarConversas(2)).toEqual({ conversas: [], pagina: 2, paginas: 3 });
    await api.obterConversa(7); await api.renomearConversa(7, '  Novo título  '); await api.excluirConversa(7);
    expect(fetchMock.mock.calls.map(c => c[0])).toEqual(['/api/v1/conversas?pagina=2&por_pagina=20', '/api/v1/conversas/7', '/api/v1/conversas/7', '/api/v1/conversas/7']);
    expect(fetchMock.mock.calls[2][1]).toMatchObject({ method: 'PATCH', body: JSON.stringify({ titulo: 'Novo título' }) });
    expect(fetchMock.mock.calls[3][1].method).toBe('DELETE');
  });
  it('valida pergunta, fontes, conversa e título sem enviar uma requisição inválida', async () => {
    for (const [pergunta, fontes, id] of [[' ', [12], undefined], ['a'.repeat(2001), [12], undefined],
      ['manual', [], undefined], ['manual', [0], undefined], ['manual', [12], 0]] as Array<[string, number[], number | undefined]>) {
      await expect(api.perguntarConversa(pergunta, fontes, id)).rejects.toThrow();
    }
    await expect(api.renomearConversa(7, ' ')).rejects.toThrow();
    await expect(api.obterConversa(NaN)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('propaga falhas e descarta a chave inválida sem encerrar o login', async () => {
    for (const status of [409, 503, 401]) {
      fetchMock.mockResolvedValueOnce(Response.json({ detail: 'Falha de teste.' }, { status }));
      await expect(api.perguntarConversa('manual', [12], 7)).rejects.toMatchObject({ status, mensagem: 'Falha de teste.' });
    }
    expect(useAutenticacaoStore.getState().tokenAcesso).toBe('jwt-ficticio');
    expect(useChaveConsumoStore.getState().chave).toBe('');
  });
  it('não lê o detalhe com outra chave se ela mudar durante o envio', async () => {
    fetchMock.mockImplementationOnce(async () => {
      useChaveConsumoStore.getState().usar('outra-chave-ficticia');
      return Response.json({ dados: { conversa_id: 7, resposta: 'Resposta', anexos: [] } });
    });
    await expect(api.perguntarConversa('manual', [12])).rejects.toThrow('alterada');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
