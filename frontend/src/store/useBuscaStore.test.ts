import { describe, expect, it, vi } from 'vitest';
import { criarStoreBusca } from './useBuscaStore';
import type { RespostaPesquisa } from '../services/api';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };
const fontes = [{ id: '12', nome: 'RH' }, { id: '13', nome: 'TI' }];
const resposta: RespostaPesquisa = {
  total: 15, pagina: 1, tamanho: 10, paginas_totais: 2,
  resultados: [{ fonte_dados_id: 12, documento_id: 'arquivo-123', nome_documento: 'manual.pdf', pontuacao: 2.5, trechos: [] }],
};
function preparar() {
  const sessao = { usuario, tokenAcesso: 'jwt-ficticio' };
  const cliente = { pesquisarDocumentos: vi.fn().mockResolvedValue(resposta) };
  return { sessao, cliente, store: criarStoreBusca(cliente, () => sessao) };
}
function pendente() {
  let concluir!: (valor: RespostaPesquisa) => void;
  const promessa = new Promise<RespostaPesquisa>(resolve => { concluir = resolve; });
  return { promessa, concluir };
}

describe('busca de documentos', () => {
  it('pesquisa e mantém o contexto original ao mudar de página', async () => {
    const { store, cliente } = preparar();
    await store.getState().pesquisar(' manual ', fontes);
    expect(cliente.pesquisarDocumentos).toHaveBeenCalledWith('manual', [12, 13], 1);
    expect(store.getState().pesquisa).toMatchObject({ termo: 'manual', fontes, total: 15 });
    cliente.pesquisarDocumentos.mockResolvedValue({ ...resposta, pagina: 2 });
    await store.getState().pesquisar('manual', fontes, 2);
    expect(store.getState().pesquisa?.pagina).toBe(2);
    expect(store.getState().pesquisando).toBe(false);
  });

  it('bloqueia consulta sem fontes ou texto e informa a falha da API', async () => {
    const { store, cliente } = preparar();
    await store.getState().pesquisar('manual', []);
    expect(store.getState().erro).toContain('Selecione ao menos uma fonte');
    await store.getState().pesquisar(' ', fontes);
    expect(cliente.pesquisarDocumentos).not.toHaveBeenCalled();
    cliente.pesquisarDocumentos.mockRejectedValue({ mensagem: 'Motor indisponível.' });
    await store.getState().pesquisar('manual', fontes);
    expect(store.getState()).toMatchObject({ pesquisa: null, erro: 'Motor indisponível.', pesquisando: false });
  });

  it('não repõe resultados após limpar a busca ou trocar de fontes', async () => {
    const { store, cliente } = preparar();
    const espera = pendente(); cliente.pesquisarDocumentos.mockReturnValue(espera.promessa);
    const busca = store.getState().pesquisar('manual', fontes);
    expect(store.getState().pesquisando).toBe(true);
    store.getState().limpar(); espera.concluir(resposta); await busca;
    expect(store.getState()).toMatchObject({ pesquisa: null, pesquisando: false, erro: '' });
  });

  it('descarta a resposta de outra sessão e de uma consulta substituída', async () => {
    const { store, cliente, sessao } = preparar();
    const antiga = pendente(); cliente.pesquisarDocumentos.mockReturnValueOnce(antiga.promessa);
    const buscaAntiga = store.getState().pesquisar('manual', fontes);
    await store.getState().pesquisar('nova consulta', fontes);
    antiga.concluir({ ...resposta, total: 99 }); await buscaAntiga;
    expect(store.getState().pesquisa).toMatchObject({ termo: 'nova consulta', total: 15 });
    store.getState().limpar();
    const outraSessao = pendente(); cliente.pesquisarDocumentos.mockReturnValueOnce(outraSessao.promessa);
    const busca = store.getState().pesquisar('manual', fontes);
    sessao.usuario = { ...usuario, id: '8', email: 'outra@example.com' };
    sessao.tokenAcesso = 'outro-jwt-ficticio';
    outraSessao.concluir(resposta); await busca;
    expect(store.getState().pesquisa).toBeNull();
  });

  it('preserva a página anterior se o carregamento da próxima falhar', async () => {
    const { store, cliente } = preparar();
    await store.getState().pesquisar('manual', fontes);
    cliente.pesquisarDocumentos.mockRejectedValue(new Error('Tente novamente.'));
    await store.getState().pesquisar('manual', fontes, 2);
    expect(store.getState().pesquisa?.pagina).toBe(1);
    expect(store.getState().erro).toBe('Tente novamente.');
  });
});
