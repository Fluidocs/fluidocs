import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarStoreFontesDados, fontesDadosStore } from './useFontesDadosStore';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { identificarConta } from './useGerenciamentoStore';
import type { FonteDadosBackend, IndexacaoDocumento, IndexacaoLote } from '../services/api';

const a = { id: '7', nome: 'Conta A', email: 'a@example.com' };
const b = { id: '8', nome: 'Conta B', email: 'b@example.com' };
const fonte = { id: 12, nome: 'RH', descricao: '', data_criacao: '2026-10-05T12:00:00Z', data_atualizacao: '2026-10-05T12:00:00Z' };
function pendente<T>() {
  let resolver!: (valor: T) => void;
  const promessa = new Promise<T>(resolve => { resolver = resolve; });
  return { promessa, resolver };
}

describe('fontes remotas da sessão autenticada', () => {
  const cliente = {
    listarFontesDados: vi.fn<() => Promise<FonteDadosBackend[]>>(),
    criarFonteDados: vi.fn<() => Promise<FonteDadosBackend>>(),
    atualizarFonteDados: vi.fn<() => Promise<FonteDadosBackend>>(),
    excluirFonteDados: vi.fn<() => Promise<void>>(),
    indexarDocumento: vi.fn<(id: number, arquivo: File) => Promise<IndexacaoDocumento>>(),
    indexarLoteZip: vi.fn<(id: number, arquivo: File) => Promise<IndexacaoLote>>(),
  };
  beforeEach(() => {
    vi.resetAllMocks();
    useAutenticacaoStore.getState().entrar(a, 'jwt-conta-a-ficticio');
    cliente.listarFontesDados.mockResolvedValue([fonte]);
    cliente.criarFonteDados.mockResolvedValue(fonte);
    cliente.atualizarFonteDados.mockResolvedValue({ ...fonte, nome: 'TI' });
    cliente.excluirFonteDados.mockResolvedValue();
    cliente.indexarDocumento.mockResolvedValue({ id_processamento: 'processo-ficticio', nome_arquivo: 'guia.txt', fonte_dados_id: 12, documento_id: 'doc-ficticio', status: 'processing' });
    cliente.indexarLoteZip.mockResolvedValue({ id_processamento: 'lote-ficticio', nome_arquivo: 'guias.zip', fonte_dados_id: 12, quantidade_arquivos: 2, status: 'processing' });
  });
  afterEach(() => useAutenticacaoStore.getState().sair());

  it('carrega IDs e datas reais, sem documentos ou cadastros locais', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    expect(store.getState().fontes).toEqual([{ id: '12', conta: identificarConta(a), nome: 'RH', descricao: '', criadoEm: fonte.data_criacao, atualizadoEm: fonte.data_atualizacao, documentos: [] }]);
  });

  it('confirma criação, edição e exclusão somente após a resposta da API', async () => {
    const store = criarStoreFontesDados(cliente);
    const criacao = pendente<FonteDadosBackend>();
    cliente.criarFonteDados.mockReturnValue(criacao.promessa);
    const salvar = store.getState().salvarFonte({ nome: 'RH', descricao: '' });
    expect(store.getState().fontes).toEqual([]);
    criacao.resolver(fonte); await salvar;
    await store.getState().salvarFonte({ nome: 'TI', descricao: '' }, '12');
    expect(cliente.atualizarFonteDados).toHaveBeenCalledWith(12, { nome: 'TI', descricao: '' });
    expect(store.getState().fontes[0].nome).toBe('TI');
    await store.getState().excluirFonte('12');
    expect(cliente.excluirFonteDados).toHaveBeenCalledWith(12);
    expect(store.getState().fontes).toEqual([]);
  });

  it('preserva registros quando salvar ou excluir falha e permite repetir uma leitura', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    cliente.atualizarFonteDados.mockRejectedValue({ mensagem: 'Não foi possível salvar' });
    cliente.excluirFonteDados.mockRejectedValue({ mensagem: 'Não foi possível excluir' });
    await expect(store.getState().salvarFonte({ nome: 'TI', descricao: '' }, '12')).rejects.toMatchObject({ mensagem: 'Não foi possível salvar' });
    await expect(store.getState().excluirFonte('12')).rejects.toMatchObject({ mensagem: 'Não foi possível excluir' });
    expect(store.getState().fontes[0].nome).toBe('RH');
    cliente.listarFontesDados.mockRejectedValueOnce({ mensagem: 'Sem conexão' });
    await store.getState().carregar();
    expect(store.getState()).toMatchObject({ erroLeitura: 'Sem conexão', carregando: false });
    await store.getState().carregar();
    expect(store.getState().erroLeitura).toBe('');
  });

  it('bloqueia IDs locais, recursos ausentes e nomes duplicados antes de enviar', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    await expect(store.getState().excluirFonte('uuid-local')).rejects.toThrow('não está mais disponível');
    await expect(store.getState().excluirFonte('99')).rejects.toThrow('não está mais disponível');
    await expect(store.getState().salvarFonte({ nome: ' RH ', descricao: '' })).rejects.toThrow('já está em uso');
    expect(cliente.excluirFonteDados).not.toHaveBeenCalled();
    expect(cliente.criarFonteDados).not.toHaveBeenCalled();
  });

  it('descarta lista e mutações atrasadas quando a conta muda', async () => {
    const store = criarStoreFontesDados(cliente);
    const resposta = pendente<FonteDadosBackend[]>();
    cliente.listarFontesDados.mockReturnValueOnce(resposta.promessa);
    const carregar = store.getState().carregar();
    useAutenticacaoStore.getState().entrar(b, 'jwt-conta-b-ficticio');
    store.getState().limpar();
    resposta.resolver([fonte]); await carregar;
    expect(store.getState().fontes).toEqual([]);
    const criacao = pendente<FonteDadosBackend>();
    cliente.criarFonteDados.mockReturnValue(criacao.promessa);
    const salvar = store.getState().salvarFonte({ nome: 'RH', descricao: '' });
    useAutenticacaoStore.getState().sair(); store.getState().limpar();
    criacao.resolver(fonte);
    expect(await salvar).toBeUndefined();
    expect(store.getState().fontes).toEqual([]);
  });

  it('uma leitura atrasada não desfaz uma exclusão confirmada', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    const exclusao = pendente<void>();
    cliente.excluirFonteDados.mockReturnValue(exclusao.promessa);
    const excluir = store.getState().excluirFonte('12');
    const resposta = pendente<FonteDadosBackend[]>();
    cliente.listarFontesDados.mockReturnValueOnce(resposta.promessa);
    const carregar = store.getState().carregar();
    exclusao.resolver(); await excluir;
    resposta.resolver([fonte]); await carregar;
    expect(store.getState()).toMatchObject({ fontes: [], carregando: false });
  });

  it('não duplica uma criação já retornada por uma leitura concorrente', async () => {
    const store = criarStoreFontesDados(cliente);
    const criacao = pendente<FonteDadosBackend>();
    cliente.criarFonteDados.mockReturnValue(criacao.promessa);
    const salvar = store.getState().salvarFonte({ nome: 'RH', descricao: '' });
    await store.getState().carregar();
    criacao.resolver(fonte); await salvar;
    expect(store.getState().fontes).toHaveLength(1);
  });

  it('limpa o store compartilhado no logout ou na mudança de token', () => {
    fontesDadosStore.setState({ fontes: [{ id: '12', conta: identificarConta(a), nome: 'RH', descricao: '', criadoEm: fonte.data_criacao, atualizadoEm: fonte.data_atualizacao, documentos: [] }] });
    useAutenticacaoStore.getState().entrar(a, 'jwt-nova-sessao-ficticio');
    expect(fontesDadosStore.getState().fontes).toEqual([]);
  });

  it('encaminha arquivos e ZIP à fonte remota, confirmando somente após a resposta', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    const resposta = pendente<IndexacaoDocumento>();
    cliente.indexarDocumento.mockReturnValueOnce(resposta.promessa);
    const texto = new File(['texto'], 'guia.txt');
    const zip = new File(['zip'], 'guias.ZIP');
    const atualizar = vi.fn();
    const envio = store.getState().indexarArquivos('12', [texto, zip], atualizar);
    expect(atualizar.mock.calls).toEqual([[0, { status: 'enviando' }]]);
    expect(cliente.indexarLoteZip).not.toHaveBeenCalled();
    resposta.resolver({ id_processamento: 'processo-ficticio', nome_arquivo: 'guia.txt', fonte_dados_id: 12, documento_id: 'doc-ficticio', status: 'processing' });
    expect(await envio).toBe(true);
    expect(cliente.indexarDocumento).toHaveBeenCalledWith(12, texto);
    expect(cliente.indexarLoteZip).toHaveBeenCalledWith(12, zip);
    expect(atualizar.mock.calls.filter(([, resultado]) => resultado.status === 'aceito')).toHaveLength(2);
    expect(store.getState().fontes[0].documentos).toEqual([]);
  });

  it('preserva o sucesso parcial e permite reenviar somente o arquivo rejeitado', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    cliente.indexarLoteZip.mockRejectedValueOnce({ mensagem: 'O ZIP está corrompido.' });
    const texto = new File(['texto'], 'guia.txt');
    const zip = new File(['zip'], 'guias.zip');
    const atualizar = vi.fn();
    await store.getState().indexarArquivos('12', [texto, zip, texto], atualizar);
    expect(atualizar).toHaveBeenCalledWith(1, { status: 'erro', mensagem: 'O ZIP está corrompido.' });
    expect(atualizar.mock.calls.filter(([, resultado]) => resultado.status === 'aceito')).toHaveLength(2);
    await store.getState().indexarArquivos('12', [zip], atualizar);
    expect(cliente.indexarDocumento).toHaveBeenCalledTimes(2);
    expect(cliente.indexarLoteZip).toHaveBeenCalledTimes(2);
  });

  it('bloqueia fontes ausentes, de outra conta e seleção inválida antes de qualquer upload', async () => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    const arquivo = new File(['texto'], 'guia.txt');
    await expect(store.getState().indexarArquivos('99', [arquivo], vi.fn())).rejects.toThrow('não está mais disponível');
    await expect(store.getState().indexarArquivos('12', [arquivo, new File([], 'vazio.txt')], vi.fn())).rejects.toThrow('está vazio');
    useAutenticacaoStore.getState().entrar(b, 'jwt-conta-b-ficticio');
    await expect(store.getState().indexarArquivos('12', [arquivo], vi.fn())).rejects.toThrow('não está mais disponível');
    expect(cliente.indexarDocumento).not.toHaveBeenCalled();
  });

  it.each(['logout', 'troca de conta', 'troca de token'])('interrompe a seleção e descarta a confirmação atrasada após %s', async mudanca => {
    const store = criarStoreFontesDados(cliente);
    await store.getState().carregar();
    const resposta = pendente<IndexacaoDocumento>();
    cliente.indexarDocumento.mockReturnValueOnce(resposta.promessa);
    const atualizar = vi.fn();
    const envio = store.getState().indexarArquivos('12', [new File(['texto'], 'guia.txt'), new File(['zip'], 'guias.zip')], atualizar);
    if (mudanca === 'logout') useAutenticacaoStore.getState().sair();
    else useAutenticacaoStore.getState().entrar(mudanca === 'troca de conta' ? b : a, 'jwt-outra-sessao-ficticio');
    resposta.resolver({ id_processamento: 'processo-ficticio', nome_arquivo: 'guia.txt', fonte_dados_id: 12, documento_id: 'doc-ficticio', status: 'processing' });
    expect(await envio).toBe(false);
    expect(atualizar.mock.calls).toEqual([[0, { status: 'enviando' }]]);
    expect(cliente.indexarLoteZip).not.toHaveBeenCalled();
    expect(store.getState().fontes[0].documentos).toEqual([]);
  });
});
