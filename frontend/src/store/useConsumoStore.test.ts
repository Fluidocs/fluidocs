import { beforeEach, describe, expect, it } from 'vitest';
import { pesquisarExemplos, responderExemplo, validarFontes, validarPergunta } from '../services/consumoDemo';
import { CHAVE_CONSUMO, criarStoreConsumo } from './useConsumoStore';
import { identificarConta, type ArmazenamentoLocal, type FonteDados } from './useGerenciamentoStore';

const conta = identificarConta({ id: '1', email: 'a@example.com' });
const outra = identificarConta({ id: '1', email: 'b@example.com' });
const fonte = (id: string, dono = conta): FonteDados => ({ id, conta: dono, nome: `Fonte ${id}`, descricao: '', criadoEm: '2026-09-16T10:00:00Z', atualizadoEm: '2026-09-16T10:00:00Z' });
const fontes = [fonte('rh'), fonte('ti'), fonte('privada', outra)];

describe('busca e respostas locais', () => {
  it('exige fontes, valida vínculo com a conta e remove IDs duplicados', () => {
    expect(() => validarFontes(conta, fontes, [])).toThrow('ao menos uma');
    expect(() => validarFontes(conta, fontes, ['privada'])).toThrow('não está mais disponível');
    expect(() => validarFontes(conta, fontes, ['excluida'])).toThrow();
    expect(validarFontes(conta, fontes, ['rh', 'rh', 'ti']).map(f => f.id)).toEqual(['rh', 'ti']);
  });

  it('pesquisa apenas nas fontes selecionadas e aceita acentos e caixa alta', () => {
    const escopo = validarFontes(conta, fontes, ['rh']);
    const resultado = pesquisarExemplos('INDEXAÇÃO', escopo);
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every(r => r.fonteId === 'rh')).toBe(true);
    expect(resultado[0].nome).toBe('guia-de-indexacao.exemplo.txt');
    expect(pesquisarExemplos('indexacao', escopo)).toEqual(resultado);
    expect(() => pesquisarExemplos('documentos', [])).toThrow();
  });

  it('não inventa resposta ou evidências para um tema ausente', () => {
    const escopo = validarFontes(conta, fontes, ['rh', 'ti']);
    expect(pesquisarExemplos('astronomia galáctica', escopo)).toEqual([]);
    const resposta = responderExemplo('astronomia galáctica', escopo);
    expect(resposta.conteudo).toContain('Não encontrei informações suficientes');
    expect(resposta.evidencias).toEqual([]);
  });

  it('cada citação corresponde exatamente a um trecho usado na resposta', () => {
    const escopo = validarFontes(conta, fontes, ['rh', 'ti']);
    const resposta = responderExemplo('indexação documentos fontes', escopo);
    expect(resposta.evidencias.length).toBeGreaterThan(0);
    expect(resposta.evidencias.length).toBeLessThanOrEqual(3);
    expect(new Set(resposta.evidencias.map(e => e.trecho)).size).toBe(resposta.evidencias.length);
    resposta.evidencias.forEach((e, i) => {
      expect(resposta.conteudo).toContain(`[${i + 1}] ${e.trecho}`);
      expect(['rh', 'ti']).toContain(e.fonteId);
    });
  });

  it('recusa perguntas vazias ou acima do limite', () => {
    expect(() => validarPergunta('  ')).toThrow();
    expect(() => validarPergunta('x'.repeat(2001))).toThrow('2.000');
    expect(validarPergunta('  indexação  ')).toBe('indexação');
  });
});

describe('histórico de conversas por conta', () => {
  let cache: Map<string, string>;
  let storage: ArmazenamentoLocal;
  beforeEach(() => {
    cache = new Map();
    storage = { getItem: chave => cache.get(chave) ?? null, setItem: (chave, valor) => { cache.set(chave, valor); } };
  });

  it('não cria conversa sem fontes ou sem uma primeira pergunta', () => {
    const store = criarStoreConsumo(() => storage);
    expect(() => store.getState().iniciar(conta, fontes, [], 'Olá')).toThrow();
    expect(() => store.getState().iniciar(conta, fontes, ['rh'], ' ')).toThrow();
    expect(store.getState().conversas).toEqual([]);
    expect(cache.has(CHAVE_CONSUMO)).toBe(false);
  });

  it('mantém as fontes fixas mesmo após novas mensagens ou alteração do cadastro', () => {
    const store = criarStoreConsumo(() => storage);
    const cadastro = fontes.map(f => ({ ...f }));
    const ids = ['rh'];
    const id = store.getState().iniciar(conta, cadastro, ids, 'Como funciona a indexação?');
    ids.push('ti'); cadastro[0].nome = 'Nome atualizado';
    store.getState().enviar(conta, id, cadastro, 'Como organizar documentos?');
    const conversa = store.getState().conversas[0];
    expect(conversa.fontes).toEqual([{ id: 'rh', nome: 'Fonte rh' }]);
    expect(conversa.mensagens).toHaveLength(4);
    expect(conversa.mensagens.flatMap(m => m.evidencias).every(e => e.fonteId === 'rh')).toBe(true);
  });

  it('recupera títulos, mensagens e evidências após recarregar o armazenamento', () => {
    const store = criarStoreConsumo(() => storage);
    const id = store.getState().iniciar(conta, fontes, ['rh', 'ti'], 'Como funciona a indexação?');
    store.getState().renomear(conta, id, 'Guia de indexação');
    const recarregado = criarStoreConsumo(() => storage);
    recarregado.getState().carregar();
    expect(recarregado.getState().conversas).toEqual(store.getState().conversas);
    expect(recarregado.getState().conversas[0].titulo).toBe('Guia de indexação');
    expect(recarregado.getState().conversas[0].mensagens[1].evidencias.length).toBeGreaterThan(0);
  });

  it('impede outra conta de enviar, renomear ou excluir e preserva seu próprio histórico', () => {
    const store = criarStoreConsumo(() => storage);
    const a = store.getState().iniciar(conta, fontes, ['rh'], 'indexação');
    const b = store.getState().iniciar(outra, fontes, ['privada'], 'indexação');
    expect(() => store.getState().enviar(outra, a, fontes, 'fontes')).toThrow();
    expect(() => store.getState().renomear(outra, a, 'Outro')).toThrow();
    expect(() => store.getState().excluir(outra, a)).toThrow();
    store.getState().excluir(conta, a);
    expect(store.getState().conversas.map(c => c.id)).toEqual([b]);
  });

  it('preserva o histórico mas impede novos envios se uma fonte original for excluída', () => {
    const store = criarStoreConsumo(() => storage);
    const id = store.getState().iniciar(conta, fontes, ['rh', 'ti'], 'indexação');
    const anterior = store.getState().conversas[0];
    expect(() => store.getState().enviar(conta, id, [fontes[0]], 'documentos')).toThrow('não está mais disponível');
    expect(store.getState().conversas[0]).toEqual(anterior);
    expect(anterior.fontes).toHaveLength(2);
  });

  it('valida a renomeação sem alterar as mensagens ou as fontes', () => {
    const store = criarStoreConsumo(() => storage);
    const id = store.getState().iniciar(conta, fontes, ['rh'], 'indexação');
    expect(() => store.getState().renomear(conta, id, '   ')).toThrow();
    expect(() => store.getState().renomear(conta, id, 'x'.repeat(81))).toThrow();
    const anterior = store.getState().conversas[0];
    store.getState().renomear(conta, id, '  Novo título  ');
    expect(store.getState().conversas[0]).toEqual({ ...anterior, titulo: 'Novo título' });
  });

  it('não adiciona mensagens nem confirma exclusão quando não consegue salvar', () => {
    const store = criarStoreConsumo(() => storage);
    const id = store.getState().iniciar(conta, fontes, ['rh'], 'indexação');
    const anterior = store.getState().conversas;
    storage.setItem = () => { throw new Error('Sem espaço'); };
    expect(() => store.getState().enviar(conta, id, fontes, 'fontes')).toThrow('Não foi possível salvar');
    expect(() => store.getState().excluir(conta, id)).toThrow();
    expect(store.getState().conversas).toEqual(anterior);
  });

  it('preserva histórico inválido em vez de sobrescrevê-lo', () => {
    cache.set(CHAVE_CONSUMO, '{inválido');
    const store = criarStoreConsumo(() => storage);
    store.getState().carregar();
    expect(store.getState().erroLeitura).toContain('preservado');
    expect(() => store.getState().iniciar(conta, fontes, ['rh'], 'indexação')).toThrow('histórico');
    expect(cache.get(CHAVE_CONSUMO)).toBe('{inválido');
    cache.set(CHAVE_CONSUMO, '[]');
    store.getState().carregar();
    expect(store.getState().erroLeitura).toBe('');
  });
});
