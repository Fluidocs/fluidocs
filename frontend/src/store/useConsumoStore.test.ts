import { describe, expect, it, vi } from 'vitest';
import { criarStoreConsumo, normalizarConversaConsumo } from './useConsumoStore';
import { identificarConta, type FonteDados } from './useGerenciamentoStore';
import type { ConversaDetalheBackend } from '../services/api';

const usuario = { id: '1', nome: 'Conta A', email: 'a@example.com' };
const conta = identificarConta(usuario);
const fonte = (id: string, dono = conta): FonteDados => ({ id, conta: dono, nome: `Fonte ${id}`,
  descricao: '', documentos: [], criadoEm: '2026-10-14T10:00:00Z', atualizadoEm: '2026-10-14T10:00:00Z' });
const fontes = [fonte('12'), fonte('13'), fonte('99', 'outra')];
const conversa: ConversaDetalheBackend = {
  id: 7, titulo: 'Manual',
  data_criacao: '2026-10-14T10:00:00Z', data_ultima_interacao: '2026-10-14T10:00:00Z',
  mensagens: [
    { id: 1, conversa_id: 7, conteudo: 'Qual é o prazo?', papel: 'U', data_envio: '2026-10-14T10:00:00Z', anexos: [] },
    { id: 2, conversa_id: 7, conteudo: 'O prazo é de 30 dias.', papel: 'A', data_envio: '2026-10-14T10:00:00Z',
      anexos: [{ id: 1, mensagem_id: 2, nome: 'manual.pdf', extensao: 'pdf' }] },
  ],
};
function pendente<T>() {
  let resolver!: (valor: T) => void;
  const promessa = new Promise<T>(resolve => { resolver = resolve; });
  return { promessa, resolver };
}
function preparar(armazenamento?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
  let sessao = { usuario, tokenAcesso: 'jwt-ficticio' };
  const { mensagens: _mensagens, ...resumo } = conversa;
  const cliente = { listarConversas: vi.fn().mockResolvedValue({ conversas: [resumo], pagina: 1, paginas: 1 }),
    obterConversa: vi.fn().mockResolvedValue(conversa), perguntarConversa: vi.fn().mockResolvedValue(conversa),
    renomearConversa: vi.fn().mockResolvedValue({ ...conversa, titulo: 'Novo título' }),
    excluirConversa: vi.fn().mockResolvedValue(undefined) };
  const store = criarStoreConsumo(cliente, () => sessao, armazenamento ? () => armazenamento : undefined);
  return { store, cliente, trocarSessao: () => { sessao = { usuario: { ...usuario, email: 'b@example.com' }, tokenAcesso: 'outro-jwt' }; store.getState().limpar(); } };
}
describe('conversas persistidas na API', () => {
  it('exige pergunta e fontes da conta antes de iniciar', async () => {
    const { store, cliente } = preparar();
    for (const [ids, pergunta] of [[[], 'manual'], [['99'], 'manual'], [['12'], ' ']] as Array<[string[], string]>) {
      await expect(store.getState().iniciar(conta, fontes, ids, pergunta)).rejects.toThrow();
    }
    expect(cliente.perguntarConversa).not.toHaveBeenCalled();
  });
  it('cria somente após confirmação da API e envia todas as fontes únicas', async () => {
    const { store, cliente } = preparar();
    const espera = pendente<ConversaDetalheBackend>(); cliente.perguntarConversa.mockReturnValue(espera.promessa);
    const envio = store.getState().iniciar(conta, fontes, ['12', '13', '12'], '  manual  ');
    expect(store.getState().enviando).toBe(true); expect(store.getState().conversas).toEqual([]);
    espera.resolver(conversa); expect(await envio).toBe('7');
    expect(cliente.perguntarConversa).toHaveBeenCalledWith('manual', [12, 13]);
    expect(store.getState().conversas[0].mensagens[1].evidencias[0]).toMatchObject({ nome: 'manual.pdf', fonteNome: 'Origem não informada pela API', trecho: null });
    expect(store.getState().enviando).toBe(false);
  });
  it('permite ler conversas da API sem fontes conhecidas e bloqueia continuar com outro escopo', async () => {
    const { store } = preparar();
    await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    store.getState().limpar();
    // Sem armazenamento, uma conversa sem seleção conhecida continua somente para leitura.
    await store.getState().carregar();
    await store.getState().detalhar('7');
    await expect(store.getState().enviar(conta, '7', fontes, 'Outra pergunta')).rejects.toThrow('Inicie outra');
  });
  it('mantém as fontes selecionadas após recarregar o histórico nesta aba', async () => {
    const { store, cliente } = preparar();
    await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    // O resumo real não contém mensagens nem fontes.
    const { mensagens: _mensagens, ...resumo } = conversa;
    cliente.listarConversas.mockResolvedValue({ conversas: [{ ...resumo, data_ultima_interacao: '2026-10-15T10:00:00Z' }], pagina: 1, paginas: 1 });
    await store.getState().carregar(); expect(store.getState().conversas[0].detalhada).toBe(false);
    await store.getState().detalhar('7'); expect(store.getState().conversas[0].mensagens).toHaveLength(2);
    await store.getState().enviar(conta, '7', [{ ...fontes[0], nome: 'Nome atualizado' }, fontes[1]], 'Outra pergunta');
    expect(cliente.perguntarConversa).toHaveBeenCalledWith('Outra pergunta', [12], 7);
    expect(store.getState().conversas[0].fontes).toEqual([{ id: '12', nome: 'Fonte 12' }]);
  });
  it('recupera apenas a seleção de fontes desta conta após recriar o estado', async () => {
    const registros = new Map<string, string>();
    const armazenamento = { getItem: (chave: string) => registros.get(chave) ?? null,
      setItem: (chave: string, valor: string) => { registros.set(chave, valor); },
      removeItem: (chave: string) => { registros.delete(chave); } };
    const anterior = preparar(armazenamento);
    await anterior.store.getState().iniciar(conta, fontes, ['12'], 'manual');
    expect([...registros.values()]).toEqual([JSON.stringify([{ id: '12', nome: 'Fonte 12' }])]);
    const nova = preparar(armazenamento);
    await nova.store.getState().carregar(); await nova.store.getState().detalhar('7');
    await nova.store.getState().enviar(conta, '7', fontes, 'continuação');
    expect(nova.cliente.perguntarConversa).toHaveBeenCalledWith('continuação', [12], 7);
    const outra = criarStoreConsumo(nova.cliente, () => ({ usuario: { ...usuario, id: '2' }, tokenAcesso: 'outro-jwt' }), () => armazenamento);
    await outra.getState().carregar();
    expect(outra.getState().conversas[0].fontes).toEqual([]);
    await nova.store.getState().excluir(conta, '7');
    expect(registros.size).toBe(0);
  });
  it('bloqueia envios duplicados e preserva mensagens após erro de rede', async () => {
    const { store, cliente } = preparar();
    await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    const antes = store.getState().conversas;
    const espera = pendente<ConversaDetalheBackend>(); cliente.perguntarConversa.mockReturnValueOnce(espera.promessa);
    const envio = store.getState().enviar(conta, '7', fontes, 'continuação');
    await expect(store.getState().enviar(conta, '7', fontes, 'duplicada')).rejects.toThrow('Aguarde');
    espera.resolver(conversa); await envio;
    cliente.perguntarConversa.mockRejectedValueOnce({ mensagem: 'Sem conexão' });
    await expect(store.getState().enviar(conta, '7', fontes, 'falha')).rejects.toMatchObject({ mensagem: 'Sem conexão' });
    expect(store.getState().conversas).toEqual(antes); expect(store.getState().enviando).toBe(false);
  });
  it('recusa outra conta e fonte excluída sem chamar a API', async () => {
    const { store, cliente } = preparar(); await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    cliente.perguntarConversa.mockClear();
    await expect(store.getState().enviar('outra', '7', fontes, 'manual')).rejects.toThrow('outra conta');
    await expect(store.getState().enviar(conta, '7', [fontes[1]], 'manual')).rejects.toThrow('não está mais disponível');
    await expect(store.getState().renomear('outra', '7', 'Título')).rejects.toThrow();
    await expect(store.getState().excluir('outra', '7')).rejects.toThrow();
    expect(cliente.perguntarConversa).not.toHaveBeenCalled(); expect(cliente.excluirConversa).not.toHaveBeenCalled();
  });
  it('renomeia e exclui apenas após confirmação e mantém dados em caso de falha', async () => {
    const { store, cliente } = preparar(); await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    const mensagens = store.getState().conversas[0].mensagens;
    await store.getState().renomear(conta, '7', '  Novo título  ');
    expect(cliente.renomearConversa).toHaveBeenCalledWith(7, 'Novo título');
    expect(store.getState().conversas[0]).toMatchObject({ titulo: 'Novo título', mensagens });
    cliente.excluirConversa.mockRejectedValueOnce({ mensagem: 'Falha ao excluir' });
    await expect(store.getState().excluir(conta, '7')).rejects.toMatchObject({ mensagem: 'Falha ao excluir' });
    expect(store.getState().conversas).toHaveLength(1);
    await store.getState().excluir(conta, '7'); expect(store.getState().conversas).toEqual([]);
  });
  it('descarta respostas atrasadas depois de trocar a sessão', async () => {
    const { store, cliente, trocarSessao } = preparar();
    const espera = pendente<ConversaDetalheBackend>(); cliente.perguntarConversa.mockReturnValue(espera.promessa);
    const envio = store.getState().iniciar(conta, fontes, ['12'], 'manual');
    trocarSessao(); espera.resolver(conversa); expect(await envio).toBeUndefined();
    expect(store.getState().conversas).toEqual([]); expect(store.getState().enviando).toBe(false);
  });
  it('não repõe uma conversa excluída com uma listagem atrasada', async () => {
    const { store, cliente } = preparar(); await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    const espera = pendente<{ conversas: ConversaDetalheBackend[]; pagina: number; paginas: number }>();
    cliente.listarConversas.mockReturnValue(espera.promessa); const leitura = store.getState().carregar();
    await store.getState().excluir(conta, '7'); espera.resolver({ conversas: [conversa], pagina: 1, paginas: 1 }); await leitura;
    expect(store.getState().conversas).toEqual([]);
  });
  it('carrega outras páginas sem duplicar e permite repetir uma leitura com falha', async () => {
    const { store, cliente } = preparar();
    cliente.listarConversas.mockRejectedValueOnce({ mensagem: 'Sem conexão' });
    await store.getState().carregar(); expect(store.getState().erroLeitura).toBe('Sem conexão');
    await store.getState().carregar(); expect(store.getState().erroLeitura).toBe('');
    cliente.listarConversas.mockResolvedValueOnce({ conversas: [conversa, { ...conversa, id: 8 }], pagina: 2, paginas: 2 });
    await store.getState().carregar(true);
    expect(cliente.listarConversas).toHaveBeenLastCalledWith(2);
    expect(store.getState().conversas.map(c => c.id)).toEqual(['7', '8']);
  });
  it('não inventa fonte ou trecho de anexos antigos', () => {
    const antiga = { ...conversa, mensagens: [conversa.mensagens[1]] };
    expect(normalizarConversaConsumo(antiga, conta).mensagens[0].evidencias[0]).toMatchObject({ fonteNome: 'Origem não informada pela API', trecho: null });
  });
  it('agrupa os nomes repetidos dos anexos sem inventar trechos', () => {
    const anexo = conversa.mensagens[1].anexos[0];
    const dados = { ...conversa, mensagens: [{ ...conversa.mensagens[1], anexos: [anexo, { ...anexo, id: 2 }] }] };
    expect(normalizarConversaConsumo(dados, conta).mensagens[0].evidencias).toEqual([
      { id: '1', nome: 'manual.pdf', fonteNome: 'Origem não informada pela API', trecho: null },
    ]);
  });
  it('descarta um detalhe atrasado ao selecionar outra conversa já carregada', async () => {
    const { store, cliente } = preparar(); await store.getState().iniciar(conta, fontes, ['12'], 'manual');
    const espera = pendente<ConversaDetalheBackend>(); cliente.obterConversa.mockReturnValue(espera.promessa);
    const detalhe = store.getState().detalhar('8'); await store.getState().detalhar('7');
    espera.resolver({ ...conversa, id: 8 }); await detalhe;
    expect(store.getState().conversas.map(c => c.id)).toEqual(['7']);
    expect(store.getState().detalhandoId).toBeNull();
  });
});
