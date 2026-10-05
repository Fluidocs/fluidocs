import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { api, extrairMensagemErro, type DadosFonteDados, type FonteDadosBackend } from '../services/api';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { identificarConta, type FonteDados } from './useGerenciamentoStore';

type ClienteFontes = Pick<typeof api, 'listarFontesDados' | 'criarFonteDados' | 'atualizarFonteDados' | 'excluirFonteDados'>;
type Sessao = Pick<ReturnType<typeof useAutenticacaoStore.getState>, 'usuario' | 'tokenAcesso'>;
interface EstadoFontesDados {
  fontes: FonteDados[];
  carregando: boolean;
  erroLeitura: string;
  carregar: () => Promise<void>;
  salvarFonte: (dados: DadosFonteDados, id?: string) => Promise<FonteDados | undefined>;
  excluirFonte: (id: string) => Promise<boolean>;
  limpar: () => void;
}

function normalizar(fonte: FonteDadosBackend, conta: string): FonteDados {
  return {
    id: String(fonte.id), conta, nome: fonte.nome, descricao: fonte.descricao,
    criadoEm: fonte.data_criacao, atualizadoEm: fonte.data_atualizacao,
    // O CRUD de fontes não retorna documentos; não reutilizar metadados de demonstração.
    documentos: [],
  };
}

export function criarStoreFontesDados(
  cliente: ClienteFontes = api,
  obterSessao: () => Sessao = useAutenticacaoStore.getState,
) {
  let revisao = 0;
  let leitura = 0;
  return createStore<EstadoFontesDados>((set, get) => {
    function contexto() {
      const { usuario, tokenAcesso } = obterSessao();
      if (!usuario || !tokenAcesso) throw new Error('Entre novamente para gerenciar suas fontes.');
      const conta = identificarConta(usuario);
      const versao = revisao;
      return {
        conta,
        atual: () => {
          const sessao = obterSessao();
          return versao === revisao && sessao.tokenAcesso === tokenAcesso &&
            !!sessao.usuario && identificarConta(sessao.usuario) === conta;
        },
      };
    }

    function validarId(id: string, conta: string) {
      const numero = Number(id);
      if (!Number.isSafeInteger(numero) || numero < 1 || !get().fontes.some(f => f.id === id && f.conta === conta)) {
        throw new Error('Esta fonte não está mais disponível. Recarregue a lista e tente novamente.');
      }
      return numero;
    }

    return {
      fontes: [], carregando: false, erroLeitura: '',
      limpar: () => { revisao++; set({ fontes: [], carregando: false, erroLeitura: '' }); },
      carregar: async () => {
        // Uma leitura antiga não pode repor registros após uma mutação ou nova leitura.
        const numeroLeitura = ++leitura;
        const ctx = contexto();
        const leituraAtual = () => ctx.atual() && numeroLeitura === leitura;
        set({ carregando: true, erroLeitura: '' });
        try {
          const fontes = await cliente.listarFontesDados();
          if (leituraAtual()) set({ fontes: fontes.map(f => normalizar(f, ctx.conta)) });
        } catch (erro) {
          if (leituraAtual()) set({ erroLeitura: extrairMensagemErro(erro, 'Não foi possível carregar suas fontes. Tente novamente.') });
        } finally {
          if (leituraAtual()) set({ carregando: false });
        }
      },
      salvarFonte: async (dados, id) => {
        const ctx = contexto();
        if (get().carregando || get().erroLeitura) throw new Error('Carregue suas fontes antes de salvar.');
        if (get().fontes.some(f => f.conta === ctx.conta && f.id !== id && f.nome === dados.nome.trim())) {
          throw new Error('Este nome já está em uso. Escolha outro nome.');
        }
        const resultado = id
          ? await cliente.atualizarFonteDados(validarId(id, ctx.conta), dados)
          : await cliente.criarFonteDados(dados);
        if (!ctx.atual()) return;
        const fonte = normalizar(resultado, ctx.conta);
        leitura++;
        const anteriores = get().fontes;
        set({ fontes: anteriores.some(f => f.id === fonte.id)
          ? anteriores.map(f => f.id === fonte.id ? fonte : f)
          : [...anteriores, fonte], carregando: false });
        return fonte;
      },
      excluirFonte: async id => {
        const ctx = contexto();
        if (get().carregando || get().erroLeitura) throw new Error('Carregue suas fontes antes de excluir.');
        await cliente.excluirFonteDados(validarId(id, ctx.conta));
        if (!ctx.atual()) return false;
        leitura++;
        set({ fontes: get().fontes.filter(f => f.id !== id), carregando: false });
        return true;
      },
    };
  });
}

export const fontesDadosStore = criarStoreFontesDados();
useAutenticacaoStore.subscribe((sessao, anterior) => {
  if (sessao.tokenAcesso !== anterior.tokenAcesso || sessao.usuario?.id !== anterior.usuario?.id ||
      sessao.usuario?.email !== anterior.usuario?.email) fontesDadosStore.getState().limpar();
});

export function useFontesDadosStore<T>(seletor: (estado: EstadoFontesDados) => T) {
  return useStore(fontesDadosStore, seletor);
}
