import { DadosArquivo } from '../tipos';

export interface RespostaAgenteEstruturada {
  resposta: string;
  evidencias: string[];
  estruturada: boolean;
}

export interface DocumentoResposta {
  titulo: string;
  tipo: string;
  quantidadeTrechos: number;
  citacoes: DadosArquivo[];
}

const MARCADOR_ANALISE = 'Análise interna:';
const MARCADOR_RESPOSTA = 'Resposta final fundamentada:';

export function estruturarRespostaAgente(conteudo: string): RespostaAgenteEstruturada {
  const indiceAnalise = conteudo.indexOf(MARCADOR_ANALISE);
  const indiceResposta = conteudo.indexOf(MARCADOR_RESPOSTA);

  if (indiceAnalise === -1 || indiceResposta === -1 || indiceResposta <= indiceAnalise) {
    return {
      resposta: conteudo.trim(),
      evidencias: [],
      estruturada: false,
    };
  }

  const analise = conteudo.slice(indiceAnalise + MARCADOR_ANALISE.length, indiceResposta);
  const resposta = conteudo.slice(indiceResposta + MARCADOR_RESPOSTA.length).trim();
  const evidencias = Array.from(
    analise.matchAll(
      /(?:\*\s*)?Evidência\s+\d+\s*:\s*["“]?([\s\S]*?)["”]?(?=\s*(?:\*\s*)?Evidência\s+\d+\s*:|$)/gi
    ),
    (correspondencia) => correspondencia[1].trim().replace(/^["“]|["”]$/g, '')
  ).filter(Boolean);

  return {
    resposta: resposta || conteudo.trim(),
    evidencias,
    estruturada: true,
  };
}

export function agruparDocumentosResposta(anexos: DadosArquivo[]): DocumentoResposta[] {
  const documentos = new Map<string, DadosArquivo[]>();

  anexos.forEach((anexo) => {
    const chave = `${anexo.titulo}::${anexo.tipo}`;
    documentos.set(chave, [...(documentos.get(chave) ?? []), anexo]);
  });

  return Array.from(documentos.values(), (citacoes) => ({
    titulo: citacoes[0].titulo,
    tipo: citacoes[0].tipo,
    quantidadeTrechos: citacoes.length,
    citacoes,
  }));
}
