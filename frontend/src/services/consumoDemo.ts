import type { FonteDados } from '../store/useGerenciamentoStore';

export interface FonteConsulta { id: string; nome: string }
export interface DocumentoDemo {
  id: string;
  fonteId: string;
  fonteNome: string;
  nome: string;
  tipo: string;
  indexadoEm: string;
  titulo: string;
  trecho: string;
}

export function validarFontes(conta: string, fontes: FonteDados[], ids: string[]): FonteConsulta[] {
  const unicos = [...new Set(ids)];
  if (!conta || !unicos.length) throw new Error('Selecione ao menos uma fonte de dados para continuar.');
  return unicos.map(id => {
    const fonte = fontes.find(f => f.id === id && f.conta === conta);
    if (!fonte) throw new Error('Uma fonte selecionada não está mais disponível. Confira a seleção e tente novamente.');
    return { id: fonte.id, nome: fonte.nome };
  });
}

export function validarPergunta(entrada: string) {
  const texto = entrada.trim();
  if (!texto) throw new Error('Escreva o que você quer consultar.');
  if (texto.length > 2000) throw new Error('Use até 2.000 caracteres por consulta.');
  return texto;
}

// Corpus sintético, independente dos documentos reais do usuário.
// A demonstração faz correspondência textual, não executa Elasticsearch ou um LLM.
export function documentosDeExemplo(fontes: FonteConsulta[]): DocumentoDemo[] {
  return fontes.flatMap(fonte => [
    { id: `${fonte.id}:onboarding`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'guia-onboarding-2026.exemplo.pdf', tipo: 'PDF', indexadoEm: '2026-08-18T13:30:00.000Z', titulo: 'Primeiros dias na Prisma Norte', trecho: 'O onboarding começa com a apresentação da equipe e a configuração dos acessos. Na primeira semana, cada novo talento recebe uma pessoa madrinha, conhece os rituais do time e combina com a liderança um plano de integração para os primeiros 30 dias.' },
    { id: `${fonte.id}:beneficios`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'politica-de-beneficios.exemplo.pdf', tipo: 'PDF', indexadoEm: '2026-08-14T16:45:00.000Z', titulo: 'Benefícios e bem-estar', trecho: 'A Prisma Norte oferece auxílio para trabalho remoto, horário flexível, apoio à saúde e uma verba anual de desenvolvimento. Solicitações de cursos e livros devem indicar a relação do conteúdo com o plano de desenvolvimento individual.' },
    { id: `${fonte.id}:feedback`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'rituais-de-pessoas.exemplo.docx', tipo: 'DOCX', indexadoEm: '2026-08-08T11:15:00.000Z', titulo: 'Conversas de desenvolvimento', trecho: 'As conversas individuais acontecem quinzenalmente. A pauta pode incluir prioridades, impedimentos, bem-estar e evolução profissional. A cada trimestre, liderança e pessoa colaboradora revisam objetivos e registram os próximos passos do plano de desenvolvimento.' },
    { id: `${fonte.id}:frontend`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'padroes-frontend.exemplo.md', tipo: 'MD', indexadoEm: '2026-07-29T14:20:00.000Z', titulo: 'Padrões para desenvolvimento frontend', trecho: 'Novas interfaces devem usar componentes compartilhados, estados explícitos de carregamento e erro, navegação por teclado e testes para os fluxos críticos. A revisão de código verifica legibilidade, acessibilidade e aderência aos contratos da API.' },
    { id: `${fonte.id}:revisao`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'guia-revisao-de-codigo.exemplo.md', tipo: 'MD', indexadoEm: '2026-07-24T17:10:00.000Z', titulo: 'Revisão de código', trecho: 'Toda mudança deve ser pequena o suficiente para revisão objetiva. A descrição informa contexto, risco e evidências de teste. Pelo menos uma aprovação é necessária antes da integração, e comentários bloqueantes devem ser resolvidos ou discutidos com quem revisou.' },
    { id: `${fonte.id}:deploy`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'runbook-deploy.exemplo.md', tipo: 'MD', indexadoEm: '2026-07-17T12:00:00.000Z', titulo: 'Publicação de uma nova versão', trecho: 'Antes do deploy, confirme os testes automatizados, registre mudanças de banco e prepare o plano de reversão. A publicação começa no ambiente de homologação; depois da validação, a versão segue para produção com monitoramento de erros e métricas essenciais.' },
  ]);
}

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
const ignoradas = new Set(['como', 'qual', 'quais', 'onde', 'quando', 'para', 'pela', 'pelo', 'pelas', 'pelos', 'sobre', 'uma', 'umas', 'uns', 'que', 'dos', 'das', 'com', 'por', 'esta', 'este', 'isso', 'sao', 'ser', 'tem', 'voce', 'pode', 'funciona']);

export function pesquisarExemplos(consulta: string, fontes: FonteConsulta[]): DocumentoDemo[] {
  validarPergunta(consulta);
  if (!fontes.length) throw new Error('Selecione ao menos uma fonte de dados para pesquisar.');
  const termos = [...new Set(normalizar(consulta).split(/[^a-z0-9]+/).filter(t => t.length > 2 && !ignoradas.has(t)))];
  if (!termos.length) return [];
  return documentosDeExemplo(fontes)
    .map(documento => {
      const conteudo = normalizar(`${documento.titulo} ${documento.trecho} ${documento.fonteNome}`);
      return { documento, pontos: termos.filter(t => conteudo.includes(t)).length };
    })
    .filter(r => r.pontos > 0)
    .sort((a, b) => b.pontos - a.pontos)
    .map(r => r.documento);
}

export function responderExemplo(pergunta: string, fontes: FonteConsulta[]) {
  const encontrados = pesquisarExemplos(pergunta, fontes);
  // Textos idênticos em fontes diferentes não viram evidências repetidas.
  const evidencias = encontrados.filter((d, i, todos) => todos.findIndex(outro => outro.trecho === d.trecho) === i).slice(0, 3);
  return {
    conteudo: evidencias.length
      ? `Encontrei as seguintes informações:\n\n${evidencias.map((d, i) => `[${i + 1}] ${d.trecho}`).join('\n\n')}`
      : 'Não encontrei informações suficientes para responder a esta pergunta. Tente perguntar sobre onboarding, benefícios, feedback, revisão de código ou deploy.',
    evidencias,
  };
}
