import { describe, expect, it } from 'vitest';
import { agruparDocumentosResposta, estruturarRespostaAgente } from './respostaAgente';

describe('estruturarRespostaAgente', () => {
  it('separa a resposta final das evidencias retornadas pelo agente', () => {
    const conteudo =
      'Análise interna: As evidências são: * Evidência 1: "Primeiro trecho" * Evidência 6: "Segundo trecho" Resposta final fundamentada: O diabetes é um distúrbio metabólico.';

    expect(estruturarRespostaAgente(conteudo)).toEqual({
      resposta: 'O diabetes é um distúrbio metabólico.',
      evidencias: ['Primeiro trecho', 'Segundo trecho'],
      estruturada: true,
    });
  });

  it('preserva uma resposta comum sem criar secoes artificiais', () => {
    expect(estruturarRespostaAgente('Uma resposta direta.')).toEqual({
      resposta: 'Uma resposta direta.',
      evidencias: [],
      estruturada: false,
    });
  });
});

describe('agruparDocumentosResposta', () => {
  it('agrupa trechos do mesmo documento sem perder as citacoes', () => {
    const documentos = agruparDocumentosResposta([
      {
        id: 1,
        titulo: 'Manual.pdf',
        tipo: 'pdf',
        repositorio: '',
        data: '',
        trecho: 'Primeiro trecho.',
      },
      {
        id: 2,
        titulo: 'Manual.pdf',
        tipo: 'pdf',
        repositorio: '',
        data: '',
        trecho: 'Segundo trecho.',
      },
    ]);

    expect(documentos).toHaveLength(1);
    expect(documentos[0]).toMatchObject({
      titulo: 'Manual.pdf',
      tipo: 'pdf',
      quantidadeTrechos: 2,
    });
    expect(documentos[0].citacoes).toHaveLength(2);
  });
});
