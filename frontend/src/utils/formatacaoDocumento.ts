function normalizarEntrada(texto: string): string {
  return texto
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?mark>/gi, '')
    .replace(/\s+(\|[^\n]*?\|)(?=\s+\||$)/g, '\n$1');
}

function limparMarkdownInline(texto: string): string {
  return texto
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .replace(/`/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#{1,6}\s*/, '')
    .trim();
}

function ehSeparadorTabela(linha: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(linha);
}

function converterLinhaTabela(linha: string): string {
  const celulas = linha
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((celula) => limparMarkdownInline(celula).replace(/\s+/g, ' '))
    .filter(Boolean);

  return celulas.join(' - ');
}

export function formatarTextoDocumento(texto: string): string {
  const linhas = normalizarEntrada(texto).split(/\r?\n/);
  const linhasFormatadas: string[] = [];

  for (const linha of linhas) {
    const linhaLimpa = linha.trim();

    if (!linhaLimpa || ehSeparadorTabela(linhaLimpa)) {
      continue;
    }

    if (linhaLimpa.includes('|')) {
      linhasFormatadas.push(converterLinhaTabela(linhaLimpa));
      continue;
    }

    linhasFormatadas.push(limparMarkdownInline(linhaLimpa).replace(/\s+/g, ' '));
  }

  return linhasFormatadas
    .filter(Boolean)
    .join('\n\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function criarPreviaTexto(texto: string, limite = 100): string {
  const textoPlano = formatarTextoDocumento(texto)
    .replace(/\s+/g, ' ')
    .trim();

  if (textoPlano.length <= limite) return textoPlano;

  return `${textoPlano.slice(0, limite).trim()}...`;
}
