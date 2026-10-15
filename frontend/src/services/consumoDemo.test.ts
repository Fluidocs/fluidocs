import { describe, expect, it } from 'vitest';
import { pesquisarExemplos, responderExemplo, validarFontes, validarPergunta } from './consumoDemo';
import { identificarConta, type FonteDados } from '../store/useGerenciamentoStore';
const conta = identificarConta({ id: '1', email: 'a@example.com' });
const outra = identificarConta({ id: '1', email: 'b@example.com' });
const fonte = (id: string, dono = conta): FonteDados => ({ id, conta: dono, nome: `Fonte ${id}`, descricao: '', documentos: [], criadoEm: '2026-09-16T10:00:00Z', atualizadoEm: '2026-09-16T10:00:00Z' });
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
    const resultado = pesquisarExemplos('REVISÃO', escopo);
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every(r => r.fonteId === 'rh')).toBe(true);
    expect(resultado[0].nome).toBe('padroes-frontend.exemplo.md');
    expect(pesquisarExemplos('revisao', escopo)).toEqual(resultado);
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
    const resposta = responderExemplo('revisão código desenvolvimento', escopo);
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
