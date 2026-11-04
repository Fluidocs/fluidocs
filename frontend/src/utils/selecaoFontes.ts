export function atualizarSelecaoFontes(fontes: { id: string }[], selecionadas: string[]): string[] {
  return fontes.length === 1
    ? [fontes[0].id]
    : selecionadas.filter(id => fontes.some(fonte => fonte.id === id));
}
