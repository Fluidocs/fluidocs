/**
 * Sanitiza um trecho de texto contendo marcações de destaque (<mark>) enviadas pela API.
 * Escapa estritamente todas as tags HTML perigosas para prevenir Cross-Site Scripting (XSS),
 * permitindo de forma ultra-controlada apenas as marcações de realce visuais do Fluidocs.
 */
export function sanitizarTrecho(htmlCru: string): string {
  if (!htmlCru) return '';
  
  // 1. Converte e escapa as marcações originais para um formato intermediário único
  // para evitar que sejam limpas na etapa de escape de caracteres.
  let textoProcessado = htmlCru
    .replace(/<mark>/gi, '[[MARK_OPEN]]')
    .replace(/<\/mark>/gi, '[[MARK_CLOSE]]');

  // 2. Escapa todos os caracteres especiais de HTML para neutralizar injeções de tags (script, iframe, etc.)
  textoProcessado = textoProcessado
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');

  // 3. Restaura as marcações de realce seguras formatadas com classes CSS premium do Tailwind v4
  const htmlSeguro = textoProcessado
    .replace(/\[\[MARK_OPEN\]\]/g, '<mark class="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold px-0.5 rounded transition-colors duration-200">')
    .replace(/\[\[MARK_CLOSE\]\]/g, '</mark>');

  return htmlSeguro;
}
