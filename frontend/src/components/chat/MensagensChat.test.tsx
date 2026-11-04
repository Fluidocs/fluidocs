import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MensagensChat } from './MensagensChat';
import type { EvidenciaConversa, MensagemConsumo } from '../../store/useConsumoStore';

const mensagem: MensagemConsumo = {
  id: '1', papel: 'assistente', conteudo: 'O prazo é de 30 dias.', criadoEm: '', evidencias: [],
};
const evidencia: EvidenciaConversa = { id: '1', nome: 'manual.pdf', fonteNome: 'RH', trecho: 'O prazo é de 30 dias.' };
function renderizar(evidencias: EvidenciaConversa[]) {
  return renderToStaticMarkup(<MensagensChat mensagens={[{ ...mensagem, evidencias }]} conversaId="7" />);
}

describe('indicador de resposta em andamento', () => {
  it('mostra os três pontos após a pergunta enquanto o agente está pensando', () => {
    const html = renderToStaticMarkup(<MensagensChat mensagens={[{ ...mensagem, papel: 'usuario', conteudo: 'Qual é o prazo?' }]} conversaId="nova" enviando />);
    expect(html).toContain('role="status"');
    expect(html).toContain('O agente está pensando…');
    expect(html).toContain('<span>.</span><span>.</span><span>.</span>');
    expect(html.indexOf('Qual é o prazo?')).toBeLessThan(html.indexOf('chat-pensando'));
    expect(html).not.toContain('Copiar resposta');
  });

  it('remove o indicador ao encerrar o envio e mostra a resposta normalmente', () => {
    const html = renderToStaticMarkup(<MensagensChat mensagens={[mensagem]} conversaId="7" enviando={false} />);
    expect(html).not.toContain('chat-pensando');
    expect(html).not.toContain('O agente está pensando');
    expect(html).toContain(mensagem.conteudo);
    expect(html).toContain('Copiar resposta');
  });
});

describe('referências nas mensagens do agente', () => {
  it('exibe e conta apenas os arquivos que possuem trecho', () => {
    const html = renderizar([
      { ...evidencia, id: '2', nome: 'sem-trecho.pdf', trecho: null },
      evidencia,
      { ...evidencia, id: '3', nome: 'vazio.pdf', trecho: ' \n\t ' },
    ]);
    expect(html).toContain('1 arquivo usado');
    expect(html).toContain('manual.pdf');
    expect(html).toContain('<blockquote>O prazo é de 30 dias.</blockquote>');
    expect(html).not.toContain('sem-trecho.pdf');
    expect(html).not.toContain('vazio.pdf');
    expect(html).not.toContain('não foi registrado');
  });

  it('oculta a seção de arquivos quando não há trechos e mantém a resposta', () => {
    const html = renderizar([{ ...evidencia, trecho: null }]);
    expect(html).not.toContain('chat-evidencias');
    expect(html).not.toContain('manual.pdf');
    expect(html).toContain(mensagem.conteudo);
    expect(html).toContain('Copiar resposta');
  });
});
