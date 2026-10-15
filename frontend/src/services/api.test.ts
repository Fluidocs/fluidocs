import { describe, expect, it } from 'vitest';
import { normalizarRepositorioBackend } from './api';

describe('normalização de repositórios legados', () => {
  it('converte um repositorio real da API para o formato da interface', () => {
    expect(
      normalizarRepositorioBackend({
        id: 7,
        descricao: 'Contratos',
        url_integracao: 'https://drive.google.com/contratos',
        grupo_acesso_id: 3,
      })
    ).toEqual({
      id: '7',
      descricao: 'Contratos',
      url_repositorio_integracao: 'https://drive.google.com/contratos',
      tipo: 'local',
      gruposAcesso: ['3'],
    });
  });
});
