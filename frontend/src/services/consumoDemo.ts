import type { FonteDados } from '../store/useGerenciamentoStore';

export interface FonteConsulta { id: string; nome: string }
export interface DocumentoDemo {
  id: string;
  fonteId: string;
  fonteNome: string;
  nome: string;
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
    { id: `${fonte.id}:organizacao`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'organizacao-de-fontes.exemplo.txt', titulo: 'Organizar informações por fonte', trecho: `Neste exemplo, a fonte “${fonte.nome}” reúne documentos de um mesmo assunto. Um nome claro e uma descrição ajudam a identificar o conteúdo. A seleção de fontes delimita quais informações serão consultadas na pesquisa ou na conversa.` },
    { id: `${fonte.id}:indexacao`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'guia-de-indexacao.exemplo.txt', titulo: 'Como funciona a indexação', trecho: 'A indexação prepara os documentos para consulta: extrai o texto, divide o conteúdo em trechos e organiza as informações para recuperação. No fluxo previsto do Fluidocs, esse processamento acontece em segundo plano.' },
    { id: `${fonte.id}:evidencias`, fonteId: fonte.id, fonteNome: fonte.nome, nome: 'respostas-e-evidencias.exemplo.txt', titulo: 'Entender a origem das respostas', trecho: 'Uma resposta fundamentada usa trechos recuperados das fontes selecionadas. Os arquivos apresentados junto à resposta identificam as evidências utilizadas. As fontes ficam fixas após o início da conversa; para consultar outro conjunto, crie uma nova conversa.' },
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
      : 'Não encontrei informações suficientes para responder a esta pergunta. Tente perguntar sobre organização de fontes, indexação ou origem das respostas.',
    evidencias,
  };
}
