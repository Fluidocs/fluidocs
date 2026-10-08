import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { api, extrairMensagemErro, type RespostaPesquisa } from '../services/api';
import { validarPergunta, type FonteConsulta } from '../services/consumoDemo';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { useChaveConsumoStore } from './useChaveConsumoStore';
import { identificarConta } from './useGerenciamentoStore';

interface Pesquisa extends RespostaPesquisa { termo: string; fontes: FonteConsulta[] }
interface EstadoBusca {
  pesquisa: Pesquisa | null;
  pesquisando: boolean;
  erro: string;
  limpar: () => void;
  pesquisar: (termo: string, fontes: FonteConsulta[], pagina?: number) => Promise<void>;
}
type Sessao = Pick<ReturnType<typeof useAutenticacaoStore.getState>, 'usuario' | 'tokenAcesso'>;

export function criarStoreBusca(
  cliente: Pick<typeof api, 'pesquisarDocumentos'> = api,
  obterSessao: () => Sessao = useAutenticacaoStore.getState,
) {
  let revisao = 0;
  return createStore<EstadoBusca>(set => ({
    pesquisa: null, pesquisando: false, erro: '',
    limpar: () => { revisao++; set({ pesquisa: null, pesquisando: false, erro: '' }); },
    pesquisar: async (entrada, fontes, pagina = 1) => {
      const versao = ++revisao;
      const { usuario, tokenAcesso } = obterSessao();
      const atual = () => {
        const sessao = obterSessao();
        return versao === revisao && sessao.tokenAcesso === tokenAcesso && !!usuario &&
          !!sessao.usuario && identificarConta(sessao.usuario) === identificarConta(usuario);
      };
      set({ pesquisando: true, erro: '', ...(pagina === 1 ? { pesquisa: null } : {}) });
      try {
        if (!usuario || !tokenAcesso) throw new Error('Entre novamente para pesquisar seus documentos.');
        const termo = validarPergunta(entrada);
        const escopo = fontes.map(f => ({ ...f }));
        if (!escopo.length) throw new Error('Selecione ao menos uma fonte de dados para pesquisar.');
        const resposta = await cliente.pesquisarDocumentos(termo, escopo.map(f => Number(f.id)), pagina);
        if (atual()) set({ pesquisa: { ...resposta, termo, fontes: escopo } });
      } catch (erro) {
        if (versao === revisao && (!usuario || !tokenAcesso || atual())) {
          set({ erro: extrairMensagemErro(erro, 'Não foi possível pesquisar. Tente novamente.') });
        }
      } finally {
        if (versao === revisao) set({ pesquisando: false });
      }
    },
  }));
}

export const buscaStore = criarStoreBusca();
useChaveConsumoStore.subscribe((sessao, anterior) => {
  if (sessao.chave !== anterior.chave) buscaStore.getState().limpar();
});
useAutenticacaoStore.subscribe((sessao, anterior) => {
  if (sessao.tokenAcesso !== anterior.tokenAcesso || sessao.usuario?.id !== anterior.usuario?.id ||
      sessao.usuario?.email !== anterior.usuario?.email) buscaStore.getState().limpar();
});
export function useBuscaStore<T>(seletor: (estado: EstadoBusca) => T) {
  return useStore(buscaStore, seletor);
}
