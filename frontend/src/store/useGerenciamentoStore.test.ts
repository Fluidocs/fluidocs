import { beforeEach, describe, expect, it } from 'vitest';
import { CHAVE_GERENCIAMENTO, criarStoreGerenciamento, identificarConta, type ArmazenamentoLocal } from './useGerenciamentoStore';

describe('gerenciamento local por conta', () => {
  let cache: Map<string, string>;
  let storage: ArmazenamentoLocal;
  const contaA = identificarConta({ id: '1', email: 'a@example.com' });
  const contaB = identificarConta({ id: '1', email: 'b@example.com' });

  beforeEach(() => {
    cache = new Map();
    storage = { getItem: chave => cache.get(chave) ?? null, setItem: (chave, valor) => { cache.set(chave, valor); } };
  });

  it('cria, lê, atualiza e exclui fontes, mantendo os dados ao recarregar', () => {
    const store = criarStoreGerenciamento(() => storage);
    store.getState().carregar();
    const fonte = store.getState().salvarFonte(contaA, { nome: '  Políticas   de RH ', descricao: '  Manuais internos  ' });
    expect(fonte).toMatchObject({ nome: 'Políticas de RH', descricao: 'Manuais internos', conta: contaA });
    store.getState().salvarFonte(contaA, { nome: 'RH', descricao: 'Normas e procedimentos' }, fonte.id);
    const recarregado = criarStoreGerenciamento(() => storage);
    recarregado.getState().carregar();
    expect(recarregado.getState().fontes).toEqual([expect.objectContaining({ id: fonte.id, nome: 'RH', descricao: 'Normas e procedimentos', criadoEm: fonte.criadoEm })]);
    recarregado.getState().excluirFonte(contaA, fonte.id);
    store.getState().carregar();
    expect(store.getState().fontes).toEqual([]);
  });

  it('separa contas simuladas que compartilham ID e bloqueia mutações de outra conta', () => {
    const store = criarStoreGerenciamento(() => storage);
    const a = store.getState().salvarFonte(contaA, { nome: 'RH', descricao: '' });
    store.getState().salvarFonte(contaB, { nome: 'RH', descricao: '' });
    expect(contaA).not.toBe(contaB);
    expect(identificarConta({ id: '1', email: ' A@EXAMPLE.COM ' })).toBe(contaA);
    expect(() => store.getState().excluirFonte(contaB, a.id)).toThrow('não está mais disponível');
    expect(() => store.getState().salvarFonte(contaB, { nome: 'Outro', descricao: '' }, a.id)).toThrow('não está mais disponível');
    expect(store.getState().fontes).toHaveLength(2);
  });

  it('recusa nomes vazios, repetidos e acima do limite sem criar registros', () => {
    const store = criarStoreGerenciamento(() => storage);
    const fonte = store.getState().salvarFonte(contaA, { nome: 'RH', descricao: '' });
    expect(() => store.getState().salvarFonte(contaA, { nome: ' rh ', descricao: '' })).toThrow('já está em uso');
    expect(() => store.getState().salvarFonte(contaA, { nome: '   ', descricao: '' })).toThrow('Informe um nome');
    expect(() => store.getState().salvarFonte(contaA, { nome: 'a'.repeat(81), descricao: '' })).toThrow('80 caracteres');
    expect(() => store.getState().salvarFonte(contaA, { nome: 'TI', descricao: 'a'.repeat(241) })).toThrow('240 caracteres');
    expect(() => store.getState().salvarFonte(contaA, { nome: 'RH', descricao: '' }, fonte.id)).not.toThrow();
    expect(store.getState().fontes).toHaveLength(1);
  });

  it('gera chaves fictícias distintas e persiste somente metadados, nunca o valor completo', () => {
    const store = criarStoreGerenciamento(() => storage);
    const primeira = store.getState().criarChave(contaA, 'Portal');
    const segunda = store.getState().criarChave(contaA, 'Aplicativo');
    expect(primeira.valor).toMatch(/^fd_demo_[a-f0-9]{48}$/);
    expect(primeira.valor).not.toBe(segunda.valor);
    expect(primeira.registro.final).toBe(primeira.valor.slice(-4));
    expect(JSON.stringify(store.getState())).not.toContain(primeira.valor);
    expect(cache.get(CHAVE_GERENCIAMENTO)).not.toContain(primeira.valor);
    expect(cache.get(CHAVE_GERENCIAMENTO)).not.toContain(segunda.valor);
    const recarregado = criarStoreGerenciamento(() => storage);
    recarregado.getState().carregar();
    expect(recarregado.getState().chaves).toHaveLength(2);
    expect(recarregado.getState().chaves[0]).not.toHaveProperty('valor');
  });

  it('registra apenas os metadados dos documentos e evita nomes repetidos na mesma fonte', () => {
    const store = criarStoreGerenciamento(() => storage);
    const fonte = store.getState().salvarFonte(contaA, { nome: 'Contratos', descricao: '' });
    const documentos = store.getState().registrarDocumentos(contaA, fonte.id, ['contrato.pdf', 'planilha.XLSX']);
    expect(documentos).toHaveLength(2);
    expect(documentos[1]).toMatchObject({ nome: 'planilha.XLSX', extensao: 'xlsx' });
    expect(store.getState().fontes[0].documentos).toEqual(documentos);
    expect(JSON.stringify(store.getState())).not.toContain('conteudo');
    expect(() => store.getState().registrarDocumentos(contaA, fonte.id, ['CONTRATO.PDF'])).toThrow('já aparecem');
  });

  it('renomeia sem alterar a identificação e exclui apenas a chave selecionada da conta', () => {
    const store = criarStoreGerenciamento(() => storage);
    const a = store.getState().criarChave(contaA, 'Portal').registro;
    const b = store.getState().criarChave(contaB, 'Portal').registro;
    expect(() => store.getState().renomearChave(contaB, a.id, 'Invasão')).toThrow();
    expect(() => store.getState().excluirChave(contaB, a.id)).toThrow();
    store.getState().renomearChave(contaA, a.id, 'Portal interno');
    expect(store.getState().chaves.find(c => c.id === a.id)).toMatchObject({ nome: 'Portal interno', final: a.final, criadoEm: a.criadoEm });
    store.getState().excluirChave(contaA, a.id);
    expect(store.getState().chaves).toEqual([b]);
  });

  it('recusa renomear uma chave para um nome duplicado dentro da mesma conta', () => {
    const store = criarStoreGerenciamento(() => storage);
    const a = store.getState().criarChave(contaA, 'Portal').registro;
    store.getState().criarChave(contaA, 'Aplicativo');
    expect(() => store.getState().renomearChave(contaA, a.id, ' aplicativo ')).toThrow('já está em uso');
    expect(() => store.getState().criarChave(contaA, '  ')).toThrow('Informe um nome');
    expect(store.getState().chaves.find(c => c.id === a.id)?.nome).toBe('Portal');
  });

  it('não confirma alterações em memória quando o armazenamento falha', () => {
    const store = criarStoreGerenciamento(() => storage);
    const fonte = store.getState().salvarFonte(contaA, { nome: 'RH', descricao: '' });
    storage.setItem = () => { throw new Error('Quota excedida'); };
    expect(() => store.getState().salvarFonte(contaA, { nome: 'TI', descricao: '' })).toThrow('Não foi possível salvar');
    expect(() => store.getState().excluirFonte(contaA, fonte.id)).toThrow('Não foi possível salvar');
    expect(() => store.getState().criarChave(contaA, 'Portal')).toThrow('Não foi possível salvar');
    expect(store.getState().fontes).toEqual([fonte]);
    expect(store.getState().chaves).toEqual([]);
  });

  it('preserva armazenamento inválido, informa a falha e permite tentar carregar novamente', () => {
    cache.set(CHAVE_GERENCIAMENTO, '{inválido');
    const store = criarStoreGerenciamento(() => storage);
    store.getState().carregar();
    expect(store.getState().erroLeitura).toContain('foram preservados');
    expect(() => store.getState().salvarFonte(contaA, { nome: 'RH', descricao: '' })).toThrow('ler os cadastros');
    expect(cache.get(CHAVE_GERENCIAMENTO)).toBe('{inválido');
    cache.set(CHAVE_GERENCIAMENTO, JSON.stringify({ fontes: [], chaves: [] }));
    store.getState().carregar();
    expect(store.getState().erroLeitura).toBe('');
  });

  it('trata bloqueio de acesso ao localStorage como erro de leitura sem travar a interface', () => {
    const store = criarStoreGerenciamento(() => { throw new Error('Acesso negado'); });
    expect(() => store.getState().carregar()).not.toThrow();
    expect(store.getState().erroLeitura).not.toBe('');
  });
});
