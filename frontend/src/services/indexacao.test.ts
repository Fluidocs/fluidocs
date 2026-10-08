import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };
const documento = { id_processamento: 'processo-ficticio', nome_arquivo: 'guia.pdf', fonte_dados_id: 12, documento_id: 'documento-ficticio', status: 'processing' };
const lote = { id_processamento: 'lote-ficticio', nome_arquivo: 'guias.zip', fonte_dados_id: 12, quantidade_arquivos: 3, status: 'processing' };

describe('contrato HTTP da indexação', () => {
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

  it('envia o arquivo real em multipart à raiz, com a fonte e o JWT', async () => {
    const arquivo = new File(['conteudo-ficticio'], 'guia.pdf', { type: 'application/pdf' });
    fetchMock.mockResolvedValue(Response.json({ dados: documento }, { status: 201 }));
    expect(await api.indexarDocumento(12, arquivo)).toEqual(documento);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/indexar/');
    expect(opcoes.method).toBe('POST');
    expect(opcoes.credentials).toBe('include');
    const cabecalhos = new Headers(opcoes.headers);
    expect(cabecalhos.get('Authorization')).toBe('Bearer jwt-ficticio');
    // O navegador gera o boundary: Content-Type JSON ou multipart manual quebraria o upload.
    expect(cabecalhos.has('Content-Type')).toBe(false);
    const corpo = opcoes.body as FormData;
    expect([...corpo.keys()]).toEqual(['fonte_dados_id', 'arquivo']);
    expect(corpo.get('fonte_dados_id')).toBe('12');
    expect((corpo.get('arquivo') as File).name).toBe('guia.pdf');
    expect(await (corpo.get('arquivo') as File).text()).toBe('conteudo-ficticio');
  });

  it('usa arquivo_zip no endpoint de lote e preserva a quantidade aceita', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: lote }, { status: 201 }));
    expect(await api.indexarLoteZip(12, new File(['zip-ficticio'], 'guias.zip'))).toEqual(lote);
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/indexar/lote-zip');
    expect(new Headers(opcoes.headers).has('Content-Type')).toBe(false);
    const corpo = opcoes.body as FormData;
    expect([...corpo.keys()]).toEqual(['fonte_dados_id', 'arquivo_zip']);
    expect((corpo.get('arquivo_zip') as File).name).toBe('guias.zip');
  });

  it.each(['PDF', 'txt', 'PNG', 'jpg', 'jpeg'])('aceita o formato %s sem exigir um MIME fornecido pelo dispositivo', async extensao => {
    fetchMock.mockResolvedValue(Response.json({ dados: documento }, { status: 201 }));
    await api.indexarDocumento(12, new File(['conteudo'], `guia.${extensao}`));
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejeita formatos ausentes ou incompatíveis, arquivos vazios e destinos inválidos antes de enviar', async () => {
    for (const nome of ['arquivo', 'arquivo.docx', 'arquivo.rar', 'arquivo.xlsx']) {
      await expect(api.indexarDocumento(12, new File(['conteudo'], nome))).rejects.toThrow('não é compatível');
    }
    await expect(api.indexarDocumento(12, new File([], 'vazio.txt'))).rejects.toThrow('está vazio');
    for (const id of [0, -1, 1.5, NaN]) {
      await expect(api.indexarDocumento(id, new File(['conteudo'], 'guia.txt'))).rejects.toThrow('fonte de dados válida');
    }
    await expect(api.indexarDocumento(12, new File(['zip'], 'guias.zip'))).rejects.toThrow('em lote');
    await expect(api.indexarLoteZip(12, new File(['texto'], 'guia.txt'))).rejects.toThrow('arquivo ZIP');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('propaga erros de validação, propriedade e conexão sem fabricar confirmação', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ mensagem: 'O ZIP está corrompido.' }, { status: 422 }));
    await expect(api.indexarLoteZip(12, new File(['zip'], 'guias.zip'))).rejects.toMatchObject({ status: 422, mensagem: 'O ZIP está corrompido.' });
    fetchMock.mockResolvedValueOnce(Response.json({ mensagem: 'Fonte não encontrada.' }, { status: 404 }));
    await expect(api.indexarDocumento(12, new File(['texto'], 'guia.txt'))).rejects.toMatchObject({ status: 404 });
    fetchMock.mockRejectedValueOnce(new TypeError('Sem conexão'));
    await expect(api.indexarDocumento(12, new File(['texto'], 'guia.txt'))).rejects.toMatchObject({ status: 0 });
  });

  it('encerra a sessão quando o JWT é rejeitado durante o envio', async () => {
    fetchMock.mockResolvedValue(Response.json({ detail: 'Token inválido.' }, { status: 401 }));
    await expect(api.indexarDocumento(12, new File(['texto'], 'guia.txt'))).rejects.toMatchObject({ status: 401 });
    expect(useAutenticacaoStore.getState().tokenAcesso).toBeNull();
  });

  it.each(['https://api.example.com/api', 'https://api.example.com/api/'])(
    'usa a raiz configurada para documentos e ZIP com VITE_API_URL=%s', async baseUrl => {
      vi.stubEnv('VITE_API_URL', baseUrl); vi.resetModules();
      const { api: cliente } = await import('./api');
      const { useAutenticacaoStore: sessao } = await import('../store/useAutenticacaoStore');
      sessao.getState().entrar(usuario, 'jwt-ficticio');
      fetchMock.mockResolvedValueOnce(Response.json({ dados: documento })).mockResolvedValueOnce(Response.json({ dados: lote }));
      await cliente.indexarDocumento(12, new File(['texto'], 'guia.txt'));
      await cliente.indexarLoteZip(12, new File(['zip'], 'guias.zip'));
      expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(['https://api.example.com/indexar/', 'https://api.example.com/indexar/lote-zip']);
      sessao.getState().sair();
    },
  );
});
