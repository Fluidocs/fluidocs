import { describe, expect, it } from 'vitest';
import {
  normalizarConversa,
  normalizarRepositorioBackend,
  normalizarRespostaAgente,
} from './api';

describe('normalizacao da API do assistente', () => {
  it('converte o historico da conversa para mensagens da interface', () => {
    const conversa = normalizarConversa({
      id: 12,
      titulo: 'Politica de ferias',
      historico: [
        { papel: 'usuario', conteudo: 'Quantos dias posso tirar?' },
        { papel: 'assistente', conteudo: 'Voce pode tirar 30 dias.' },
      ],
    });

    expect(conversa).toMatchObject({
      id: '12',
      titulo: 'Politica de ferias',
    });
    expect(conversa.mensagens).toEqual([
      expect.objectContaining({
        papel: 'user',
        conteudo: 'Quantos dias posso tirar?',
      }),
      expect.objectContaining({
        papel: 'assistant',
        conteudo: 'Voce pode tirar 30 dias.',
      }),
    ]);
  });

  it('converte a resposta e os documentos em mensagem com citacoes', () => {
    const mensagem = normalizarRespostaAgente({
      id_conversa: 12,
      pergunta: 'Qual e o prazo?',
      resposta: 'O prazo e de 30 dias.',
      documentos: [
        {
          nome_documento: 'Contrato.pdf',
          pontuacao: 5.2,
          trechos: [
            {
              id_trecho: 9,
              pontuacao: 4.8,
              conteudo: 'O prazo contratual e de 30 dias.',
            },
          ],
        },
      ],
    });

    expect(mensagem).toMatchObject({
      papel: 'assistant',
      conteudo: 'O prazo e de 30 dias.',
      anexos: [
        {
          id: 9,
          titulo: 'Contrato.pdf',
          tipo: 'pdf',
          trecho: 'O prazo contratual e de 30 dias.',
        },
      ],
    });
  });

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
