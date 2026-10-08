import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { api, arquivoEhZip, extrairMensagemErro, validarArquivoIndexacao, type DadosFonteDados, type FonteDadosBackend, type IndexacaoDocumento, type IndexacaoLote } from '../services/api';
import { useAutenticacaoStore } from './useAutenticacaoStore';
import { useChaveConsumoStore } from './useChaveConsumoStore';
import { identificarConta, type FonteDados } from './useGerenciamentoStore';

type ClienteFontes = Pick<typeof api, 'listarFontesDados' | 'criarFonteDados' | 'atualizarFonteDados' | 'excluirFonteDados' | 'indexarDocumento' | 'indexarLoteZip'>;
type Sessao = Pick<ReturnType<typeof useAutenticacaoStore.getState>, 'usuario' | 'tokenAcesso'>;

export type ResultadoEnvioIndexacao =
  | { status: 'enviando' }
  | { status: 'aceito'; resposta: IndexacaoDocumento | IndexacaoLote }
  | { status: 'erro'; mensagem: string };

export type IndexarArquivos = (
  id: string,
  arquivos: File[],
  aoAtualizar: (indice: number, resultado: ResultadoEnvioIndexacao) => void,
) => Promise<boolean>;

interface EstadoFontesDados {
  fontes: FonteDados[];
  carregando: boolean;
  erroLeitura: string;
  carregar: () => Promise<void>;
  salvarFonte: (dados: DadosFonteDados, id?: string) => Promise<FonteDados | undefined>;
  excluirFonte: (id: string) => Promise<boolean>;
  indexarArquivos: IndexarArquivos;
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
      indexarArquivos: async (id, arquivos, aoAtualizar) => {
        const ctx = contexto();
        if (get().carregando || get().erroLeitura) throw new Error('Carregue suas fontes antes de indexar.');
        const fonteId = validarId(id, ctx.conta);
        arquivos.forEach(validarArquivoIndexacao);
        for (const [indice, arquivo] of arquivos.entries()) {
          // Nunca enviar o restante de uma seleção com as credenciais de outra sessão.
          if (!ctx.atual()) return false;
          aoAtualizar(indice, { status: 'enviando' });
          try {
            const resposta = arquivoEhZip(arquivo)
              ? await cliente.indexarLoteZip(fonteId, arquivo)
              : await cliente.indexarDocumento(fonteId, arquivo);
            if (!ctx.atual()) return false;
            aoAtualizar(indice, { status: 'aceito', resposta });
          } catch (erro) {
            if (!ctx.atual()) return false;
            aoAtualizar(indice, { status: 'erro', mensagem: extrairMensagemErro(erro, 'Não foi possível enviar este arquivo. Tente novamente.') });
          }
        }
        // Enfileiramento não comprova a indexação: não adicionar documentos ao CRUD.
        return true;
      },
    };
  });
}

export const fontesDadosStore = criarStoreFontesDados();
export const fontesConsumoStore = criarStoreFontesDados({ ...api, listarFontesDados: api.listarFontesConsumo });
useAutenticacaoStore.subscribe((sessao, anterior) => {
  if (sessao.tokenAcesso !== anterior.tokenAcesso || sessao.usuario?.id !== anterior.usuario?.id ||
      sessao.usuario?.email !== anterior.usuario?.email) {
    fontesDadosStore.getState().limpar();
    fontesConsumoStore.getState().limpar();
  }
});
useChaveConsumoStore.subscribe((sessao, anterior) => {
  if (sessao.chave !== anterior.chave) fontesConsumoStore.getState().limpar();
});

export function useFontesDadosStore<T>(seletor: (estado: EstadoFontesDados) => T) {
  return useStore(fontesDadosStore, seletor);
}
export function useFontesConsumoStore<T>(seletor: (estado: EstadoFontesDados) => T) {
  return useStore(fontesConsumoStore, seletor);
}
