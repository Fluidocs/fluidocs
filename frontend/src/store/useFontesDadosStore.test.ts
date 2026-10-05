import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { criarStoreFontesDados, fontesDadosStore } from './useFontesDadosStore';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { identificarConta } from './useGerenciamentoStore';
import type { FonteDadosBackend } from '../services/api';

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
  };
  beforeEach(() => {
    vi.resetAllMocks();
    useAutenticacaoStore.getState().entrar(a, 'jwt-conta-a-ficticio');
    cliente.listarFontesDados.mockResolvedValue([fonte]);
    cliente.criarFonteDados.mockResolvedValue(fonte);
    cliente.atualizarFonteDados.mockResolvedValue({ ...fonte, nome: 'TI' });
    cliente.excluirFonteDados.mockResolvedValue();
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
});
