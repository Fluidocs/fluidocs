import { describe, expect, it } from 'vitest';
import { atualizarSelecaoFontes } from './selecaoFontes';

describe('seleção das fontes disponíveis', () => {
  it('marca a única fonte ao carregar ou iniciar uma nova conversa', () => {
    expect(atualizarSelecaoFontes([{ id: '12' }], [])).toEqual(['12']);
  });

  it('substitui uma seleção indisponível pela única fonte atual', () => {
    expect(atualizarSelecaoFontes([{ id: '13' }], ['12'])).toEqual(['13']);
  });

  it('mantém a escolha manual quando há várias fontes e remove IDs indisponíveis', () => {
    const fontes = [{ id: '12' }, { id: '13' }];
    expect(atualizarSelecaoFontes(fontes, [])).toEqual([]);
    expect(atualizarSelecaoFontes(fontes, ['13', 'excluida'])).toEqual(['13']);
  });

  it('limpa a seleção quando não há fontes', () => {
    expect(atualizarSelecaoFontes([], ['12'])).toEqual([]);
  });

  it('seleciona após o carregamento e preserva a escolha ao aparecer outra fonte', () => {
    const inicial = atualizarSelecaoFontes([], []);
    const carregada = atualizarSelecaoFontes([{ id: '12' }], inicial);
    expect(carregada).toEqual(['12']);
    expect(atualizarSelecaoFontes([{ id: '12' }, { id: '13' }], carregada)).toEqual(['12']);
  });
});
