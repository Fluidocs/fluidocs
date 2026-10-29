import { useAutenticacaoStore, type Usuario } from '../store/useAutenticacaoStore';
import { useChaveConsumoStore } from '../store/useChaveConsumoStore';

// Em dev, prefira VITE_API_URL=/api (proxy do Vite). Em producao, use a URL absoluta da API.
const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || '/api';
// O router registra /auth e /me na raiz; /api é reservado às rotas públicas.
const AUTH_BASE_URL = API_BASE_URL.replace(/\/$/, '').replace(/\/api$/, '');
const CONSUMO_BASE_URL = `${API_BASE_URL.replace(/\/$/, '')}/v1`;

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
}

export interface ChaveApiBackend {
  id: number;
  nome: string;
  descricao: string | null;
}

export interface ChaveApiCriada extends ChaveApiBackend {
  token: string;
}

export interface DadosChaveApi {
  nome: string;
  descricao?: string | null;
}

export interface FonteDadosBackend {
  id: number;
  nome: string;
  descricao: string;
  data_criacao: string;
  data_atualizacao: string;
}

export interface DadosFonteDados {
  nome: string;
  descricao: string;
}

export interface DocumentoFonte {
  uuid: string;
  tipo_arquivo: string | null;
  nome_documento: string;
}

export interface DocumentoDesindexado {
  id: string;
  tipo_documento: string | null;
  status: 'excluído';
  quantidade_trechos: number;
}

export interface IndexacaoDocumento {
  id_processamento: string;
  nome_arquivo: string;
  fonte_dados_id: number;
  documento_id: string;
  status: 'processing';
}

export interface IndexacaoLote {
  id_processamento: string;
  nome_arquivo: string;
  fonte_dados_id: number;
  quantidade_arquivos: number;
  status: 'processing';
}

export const FORMATOS_INDEXACAO = ['pdf', 'txt', 'png', 'jpg', 'jpeg', 'zip'] as const;

export function arquivoEhZip(arquivo: File): boolean {
  return arquivo.name.toLowerCase().endsWith('.zip');
}

export function validarArquivoIndexacao(arquivo: File): void {
  const extensao = arquivo.name.includes('.') ? arquivo.name.split('.').pop()?.toLowerCase() : '';
  if (!FORMATOS_INDEXACAO.some(formato => formato === extensao)) {
    throw new Error(`“${arquivo.name}” não é compatível. Use PDF, TXT, PNG, JPG, JPEG ou ZIP.`);
  }
  if (!arquivo.size) throw new Error(`“${arquivo.name}” está vazio. Escolha um arquivo com conteúdo.`);
}

interface UsuarioOpenAPI {
  id: number;
  nome: string;
  email: string;
}

export interface RespostaPesquisa {
  total: number;
  pagina: number;
  tamanho: number;
  paginas_totais: number;
  resultados: DocumentoPesquisa[];
}

export interface AnexoConversaBackend {
  id: number; mensagem_id: number; nome: string; extensao: string;
  trecho?: string | null;
}
export interface MensagemConversaBackend {
  id: number; conversa_id: number; conteudo: string; papel: 'U' | 'A';
  data_envio: string; anexos: AnexoConversaBackend[];
}
export interface ConversaResumoBackend {
  id: number; titulo: string; data_criacao: string; data_ultima_interacao: string;
}
export interface ConversaDetalheBackend extends ConversaResumoBackend {
  mensagens: MensagemConversaBackend[];
}
export interface ListaConversasBackend {
  conversas: ConversaResumoBackend[]; pagina: number; paginas: number;
}
interface RespostaConversaBackend {
  conversa_id: number;
  resposta: string;
  anexos: AnexoConversaBackend[];
}

function validarIdConversa(id: number): void {
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Selecione uma conversa válida.');
}

export interface DocumentoPesquisa {
  fonte_dados_id: number;
  documento_id: string;
  nome_documento: string;
  pontuacao: number;
  trechos: Array<{ id_trecho: number | null; conteudo: string | null; pontuacao: number }>;
}

export interface RepositorioBackend {
  id: string;
  descricao: string;
  url_repositorio_integracao: string;
  tipo: 'gdrive' | 'onedrive' | 'local';
  gruposAcesso: string[];
}

export interface ErroAPI {
  status?: number;
  erro: string;
  codigo?: string;
  mensagem: string;
  detalhes?: Array<{ campo: string; mensagem: string }>;
}

interface BaseResponse<T> {
  dados: T;
  paginacao?: PaginacaoOpenAPI | null;
}

interface RepositorioOpenAPI {
  id: number | string;
  descricao: string;
  url_integracao?: string | null;
  url_repositorio_integracao?: string;
  tipo?: 'gdrive' | 'onedrive' | 'local';
  grupo_acesso_id?: number | null;
  gruposAcesso?: string[];
}

interface RespostaLoteZipOpenAPI {
  dados: {
    repositorio: RepositorioOpenAPI;
    indexacao?: unknown;
  };
}

interface PaginacaoOpenAPI {
  total: number;
  pagina: number;
  por_pagina: number;
  paginas: number;
}

type RespostaRepositorio =
  | RepositorioOpenAPI
  | { dados: RepositorioOpenAPI }
  | RespostaLoteZipOpenAPI;

function normalizarErroAPI(status: number, corpo: unknown): ErroAPI {
  if (corpo && typeof corpo === 'object') {
    const objeto = corpo as Record<string, unknown>;

    if (typeof objeto.mensagem === 'string') {
      return {
        erro: typeof objeto.erro === 'string' ? objeto.erro : 'Erro',
        codigo: typeof objeto.codigo === 'string' ? objeto.codigo : undefined,
        mensagem: objeto.mensagem,
      };
    }

    if (typeof objeto.detail === 'string') {
      const mensagensPorStatus: Record<number, string> = {
        404: 'Recurso nao encontrado no orquestrador.',
        405: 'Operacao nao disponivel neste orquestrador.',
        500: 'Erro interno no orquestrador ao processar a requisicao.',
      };

      return {
        erro: 'Erro',
        mensagem: mensagensPorStatus[status] ?? objeto.detail,
      };
    }

    if (Array.isArray(objeto.detail)) {
      const mensagens = objeto.detail
        .map((item) => {
          if (!item || typeof item !== 'object') return '';
          const detalhe = item as { msg?: string; loc?: Array<string | number> };
          const campo = detalhe.loc?.filter((parte) => typeof parte === 'string').join('.') ?? '';
          return campo ? `${campo}: ${detalhe.msg ?? 'invalido'}` : (detalhe.msg ?? '');
        })
        .filter(Boolean);

      return {
        erro: 'Validacao',
        mensagem: mensagens.join('; ') || `A requisicao foi rejeitada (status ${status}).`,
      };
    }
  }

  if (typeof corpo === 'string' && corpo.trim()) {
    return {
      erro: 'Erro',
      mensagem: corpo.trim(),
    };
  }

  const mensagensPorStatus: Record<number, string> = {
    0: 'Nao foi possivel conectar ao orquestrador. Verifique se a API esta em execucao, se VITE_API_URL e o proxy do Vite (VITE_API_PROXY_TARGET) estao corretos.',
    401: 'Sessao expirada ou ausente. Faca login novamente.',
    403: 'Voce nao tem permissao para executar esta operacao.',
    404: 'Recurso nao encontrado no orquestrador.',
    405: 'Operacao nao disponivel neste orquestrador.',
    422: 'Os dados enviados sao invalidos. Revise o formulario.',
    500: 'Erro interno no orquestrador. Verifique os logs do servidor.',
  };

  return {
    erro: 'Erro de comunicacao',
    mensagem: mensagensPorStatus[status] ?? `A requisicao falhou com status ${status}.`,
  };
}

export function extrairMensagemErro(
  erro: unknown,
  mensagemPadrao = 'Nao foi possivel criar a fonte temporaria. Tente novamente.',
): string {
  if (erro && typeof erro === 'object' && 'mensagem' in erro) {
    const mensagem = (erro as ErroAPI).mensagem;
    if (typeof mensagem === 'string' && mensagem.trim()) {
      return mensagem;
    }
  }

  if (erro instanceof TypeError) {
    return 'Nao foi possivel conectar ao orquestrador. Em desenvolvimento, use VITE_API_URL=/api com o proxy do Vite ativo e confirme se a API responde em VITE_API_PROXY_TARGET.';
  }

  if (erro instanceof Error && erro.message.trim()) {
    return erro.message;
  }

  return mensagemPadrao;
}

function validarDadosChaveApi(dados: DadosChaveApi): DadosChaveApi {
  const nome = dados.nome.trim();
  if (!nome) throw new Error('Informe um nome para a chave.');
  if (nome.length > 60) throw new Error('Use um nome com até 60 caracteres.');
  const descricao = dados.descricao?.trim() || null;
  if (descricao && descricao.length > 255) {
    throw new Error('Use uma descrição com até 255 caracteres.');
  }
  return { nome, ...(dados.descricao !== undefined ? { descricao } : {}) };
}

function metadadosChaveApi(chave: ChaveApiBackend): ChaveApiBackend {
  // O token retornado na criação nunca deve entrar na listagem ou no armazenamento.
  return { id: chave.id, nome: chave.nome, descricao: chave.descricao };
}

function validarDadosFonte(dados: DadosFonteDados): DadosFonteDados {
  const nome = dados.nome.trim();
  const descricao = dados.descricao.trim();
  if (!nome) throw new Error('Informe um nome para a fonte.');
  if (nome.length > 100) throw new Error('Use um nome com até 100 caracteres.');
  if (descricao.length > 250) throw new Error('Use uma descrição com até 250 caracteres.');
  // A descrição vazia precisa ser string: o modelo e a resposta não aceitam null.
  return { nome, descricao };
}

export function normalizarRepositorioBackend(dados: RepositorioOpenAPI): RepositorioBackend {
  const id = String(dados.id);

  return {
    id,
    descricao: dados.descricao,
    url_repositorio_integracao:
      dados.url_repositorio_integracao ??
      dados.url_integracao ??
      `local://importacao-temporaria/${id}`,
    tipo: dados.tipo ?? 'local',
    gruposAcesso:
      dados.gruposAcesso ??
      (dados.grupo_acesso_id != null ? [String(dados.grupo_acesso_id)] : ['geral']),
  };
}

function extrairRepositorioDaResposta(resposta: RespostaRepositorio): RepositorioBackend {
  if ('dados' in resposta) {
    const dados = resposta.dados;
    const repositorio = 'repositorio' in dados ? dados.repositorio : dados;
    return normalizarRepositorioBackend(repositorio);
  }

  return normalizarRepositorioBackend(resposta);
}

async function executarRequisicao<T>(
  caminho: string,
  opcoes?: RequestInit,
  autenticacao?: { baseUrl: string; tokenAcesso: string | null },
): Promise<T> {
  const url = `${autenticacao?.baseUrl ?? API_BASE_URL}${caminho}`;
  const tokenAcesso = autenticacao
    ? autenticacao.tokenAcesso
    : useAutenticacaoStore.getState().tokenAcesso;

  const cabecalhos = new Headers(opcoes?.headers);
  if (tokenAcesso && !cabecalhos.has('Authorization')) {
    cabecalhos.set('Authorization', `Bearer ${tokenAcesso}`);
  }
  if (!cabecalhos.has('Content-Type') && !(opcoes?.body instanceof FormData)) {
    cabecalhos.set('Content-Type', 'application/json');
  }

  let resposta: Response;

  try {
    resposta = await fetch(url, {
      ...opcoes,
      headers: cabecalhos,
      credentials: 'include',
    });
  } catch {
    throw { ...normalizarErroAPI(0, null), status: 0 };
  }

  if (!resposta.ok) {
    // Uma resposta atrasada de outra sessão não deve encerrar o login atual.
    if (resposta.status === 401 && tokenAcesso &&
        useAutenticacaoStore.getState().tokenAcesso === tokenAcesso) {
      useAutenticacaoStore.getState().sair();
    }
    const textoResposta = await resposta.text();
    let corpoErro: unknown = null;

    if (textoResposta.trim()) {
      try {
        corpoErro = JSON.parse(textoResposta);
      } catch {
        corpoErro = textoResposta;
      }
    }

    throw { ...normalizarErroAPI(resposta.status, corpoErro), status: resposta.status };
  }

  if (resposta.status === 204) {
    return {} as T;
  }

  return resposta.json() as Promise<T>;
}

async function executarConsumo<T>(caminho: string, opcoes?: RequestInit, chave = useChaveConsumoStore.getState().chave): Promise<T> {
  if (!chave) throw new Error('Informe uma chave de API criada no módulo de gerenciamento.');
  const cabecalhos = new Headers(opcoes?.headers);
  cabecalhos.set('X-API-Key', chave);
  try {
    return await executarRequisicao<T>(caminho, { ...opcoes, headers: cabecalhos },
      { baseUrl: CONSUMO_BASE_URL, tokenAcesso: null });
  } catch (erro) {
    if ((erro as ErroAPI)?.status === 401 && useChaveConsumoStore.getState().chave === chave) {
      useChaveConsumoStore.getState().limpar('Chave de API inválida ou excluída. Informe uma chave ativa para continuar.');
    }
    throw erro;
  }
}

export const api = {
  listarFontesConsumo: async (): Promise<FonteDadosBackend[]> => {
    const resposta = await executarConsumo<BaseResponse<FonteDadosBackend[]>>('/fontes-dados/');
    return resposta.dados;
  },
  cadastrar: async (dados: DadosCadastro): Promise<Pick<Usuario, 'nome' | 'email'>> => {
    const resposta = await executarRequisicao<BaseResponse<Pick<Usuario, 'nome' | 'email'>>>(
      '/auth/cadastrar',
      {
        method: 'POST',
        body: JSON.stringify({ nome: dados.nome.trim(), email: dados.email.trim(), senha: dados.senha }),
      },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: null },
    );
    return resposta.dados;
  },

  autenticar: async (email: string, senha: string): Promise<TokenResponse> => {
    return executarRequisicao<TokenResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ username: email.trim(), password: senha }),
    }, { baseUrl: AUTH_BASE_URL, tokenAcesso: null });
  },

  obterUsuarioAtual: async (tokenAcesso: string): Promise<Usuario> => {
    const resposta = await executarRequisicao<BaseResponse<UsuarioOpenAPI>>('/me', undefined, {
      baseUrl: AUTH_BASE_URL,
      tokenAcesso,
    });
    return {
      id: String(resposta.dados.id),
      nome: resposta.dados.nome,
      email: resposta.dados.email,
    };
  },

  listarChavesApi: async (): Promise<ChaveApiBackend[]> => {
    const resposta = await executarRequisicao<BaseResponse<ChaveApiBackend[]>>(
      '/chaves-api', undefined,
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados.map(metadadosChaveApi);
  },

  criarChaveApi: async (dados: DadosChaveApi): Promise<ChaveApiCriada> => {
    const resposta = await executarRequisicao<BaseResponse<ChaveApiCriada>>(
      '/chaves-api',
      { method: 'POST', body: JSON.stringify(validarDadosChaveApi(dados)) },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return { ...metadadosChaveApi(resposta.dados), token: resposta.dados.token };
  },

  renomearChaveApi: async (id: number, nome: string): Promise<ChaveApiBackend> => {
    const resposta = await executarRequisicao<BaseResponse<ChaveApiBackend>>(
      `/chaves-api/${id}`,
      { method: 'PATCH', body: JSON.stringify(validarDadosChaveApi({ nome })) },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return metadadosChaveApi(resposta.dados);
  },

  excluirChaveApi: async (id: number): Promise<void> => {
    await executarRequisicao<BaseResponse<ChaveApiBackend>>(
      `/chaves-api/${id}`, { method: 'DELETE' },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
  },

  listarFontesDados: async (): Promise<FonteDadosBackend[]> => {
    const resposta = await executarRequisicao<BaseResponse<FonteDadosBackend[]>>(
      '/fontes-dados/', undefined,
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados;
  },

  criarFonteDados: async (dados: DadosFonteDados): Promise<FonteDadosBackend> => {
    const resposta = await executarRequisicao<BaseResponse<FonteDadosBackend>>(
      '/fontes-dados/',
      { method: 'POST', body: JSON.stringify(validarDadosFonte(dados)) },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados;
  },

  atualizarFonteDados: async (id: number, dados: DadosFonteDados): Promise<FonteDadosBackend> => {
    const resposta = await executarRequisicao<BaseResponse<FonteDadosBackend>>(
      `/fontes-dados/${id}`,
      { method: 'PATCH', body: JSON.stringify(validarDadosFonte(dados)) },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados;
  },

  excluirFonteDados: async (id: number): Promise<void> => {
    await executarRequisicao<BaseResponse<FonteDadosBackend>>(
      `/fontes-dados/${id}`, { method: 'DELETE' },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
  },

  listarDocumentosFonte: async (fonteId: number): Promise<DocumentoFonte[]> => {
    const resposta = await executarRequisicao<BaseResponse<{ documentos: DocumentoFonte[] }>>(
      `/fontes-dados/${fonteId}/documentos`, undefined,
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados.documentos;
  },

  desindexarDocumento: async (fonteId: number, documentoId: string): Promise<DocumentoDesindexado> => {
    const resposta = await executarRequisicao<BaseResponse<DocumentoDesindexado>>(
      `/fontes-dados/${fonteId}/documentos/${encodeURIComponent(documentoId)}`, { method: 'DELETE' },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados;
  },

  indexarDocumento: async (fonteId: number, arquivo: File): Promise<IndexacaoDocumento> => {
    validarArquivoIndexacao(arquivo);
    if (arquivoEhZip(arquivo)) throw new Error('Envie o ZIP pela indexação em lote.');
    if (!Number.isSafeInteger(fonteId) || fonteId < 1) throw new Error('Selecione uma fonte de dados válida.');
    const dados = new FormData();
    dados.append('fonte_dados_id', String(fonteId));
    dados.append('arquivo', arquivo);
    const resposta = await executarRequisicao<BaseResponse<IndexacaoDocumento>>(
      '/indexar/', { method: 'POST', body: dados },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados;
  },

  indexarLoteZip: async (fonteId: number, arquivo: File): Promise<IndexacaoLote> => {
    validarArquivoIndexacao(arquivo);
    if (!arquivoEhZip(arquivo)) throw new Error('Selecione um arquivo ZIP para indexar em lote.');
    if (!Number.isSafeInteger(fonteId) || fonteId < 1) throw new Error('Selecione uma fonte de dados válida.');
    const dados = new FormData();
    dados.append('fonte_dados_id', String(fonteId));
    dados.append('arquivo_zip', arquivo);
    const resposta = await executarRequisicao<BaseResponse<IndexacaoLote>>(
      '/indexar/lote-zip', { method: 'POST', body: dados },
      { baseUrl: AUTH_BASE_URL, tokenAcesso: useAutenticacaoStore.getState().tokenAcesso },
    );
    return resposta.dados;
  },

  pesquisarDocumentos: async (
    termo: string,
    fonteIds: number[],
    pagina = 1,
  ): Promise<RespostaPesquisa> => {
    const q = termo.trim();
    if (!q) throw new Error('Escreva o que você quer consultar.');
    if (q.length > 2000) throw new Error('Use até 2.000 caracteres por consulta.');
    if (!fonteIds.length || fonteIds.some(id => !Number.isSafeInteger(id) || id < 1)) {
      throw new Error('Selecione ao menos uma fonte de dados válida para pesquisar.');
    }
    if (!Number.isSafeInteger(pagina) || pagina < 1) throw new Error('Página de pesquisa inválida.');
    const tamanho = 10;
    const resposta = await executarConsumo<BaseResponse<DocumentoPesquisa[]>>(
      '/pesquisar', {
        method: 'POST',
        body: JSON.stringify({ q, fonte_dados_ids: [...new Set(fonteIds)], tipo_pesquisa: 'hibrida', pagina, tamanho }),
      },
    );
    return {
      resultados: resposta.dados,
      total: resposta.paginacao?.total ?? resposta.dados.length,
      pagina: resposta.paginacao?.pagina ?? pagina,
      tamanho: resposta.paginacao?.por_pagina ?? tamanho,
      paginas_totais: resposta.paginacao?.paginas ?? 1,
    };
  },

  listarRepositorios: async (): Promise<RepositorioBackend[]> => {
    const resposta = await executarRequisicao<BaseResponse<RepositorioOpenAPI[]>>('/repositorios/');
    return resposta.dados.map(normalizarRepositorioBackend);
  },

  criarRepositorio: async (repo: Omit<RepositorioBackend, 'id'>): Promise<RepositorioBackend> => {
    const resposta = await executarRequisicao<RespostaRepositorio>('/repositorios/', {
      method: 'POST',
      body: JSON.stringify(repo),
    });

    return extrairRepositorioDaResposta(resposta);
  },

  atualizarRepositorio: async (
    id: string,
    repo: Partial<Omit<RepositorioBackend, 'id'>>
  ): Promise<RepositorioBackend> => {
    const idNumerico = Number(id);
    const payload = {
      id: Number.isFinite(idNumerico) ? idNumerico : id,
      descricao: repo.descricao ?? '',
      url_integracao: repo.url_repositorio_integracao ?? null,
    };

    const resposta = await executarRequisicao<RespostaRepositorio>(`/repositorios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    return extrairRepositorioDaResposta(resposta);
  },

  importarRepositorioLocal: async (): Promise<RepositorioBackend> => {
    throw normalizarErroAPI(405, {
      detail:
        'O orquestrador nao expoe POST /repositorios/importacao-local. Envie um unico arquivo .zip para criar a fonte temporaria.',
    });
  },

  importarRepositorioZip: async (
    descricao: string,
    lote_zip: File
  ): Promise<RepositorioBackend> => {
    const params = new URLSearchParams();
    if (descricao) params.append('descricao', descricao);

    const dados = new FormData();
    dados.append('lote_zip', lote_zip);

    const resposta = await executarRequisicao<RespostaRepositorio>(
      `/repositorios/lote-zip?${params.toString()}`,
      {
        method: 'POST',
        body: dados,
      }
    );

    return extrairRepositorioDaResposta(resposta);
  },

  deletarRepositorio: async (id: string): Promise<void> => {
    await executarRequisicao<BaseResponse<null>>(`/repositorios/${id}`, {
      method: 'DELETE',
    });
  },

  listarConversas: async (pagina = 1): Promise<ListaConversasBackend> => {
    if (!Number.isSafeInteger(pagina) || pagina < 1) throw new Error('Página de conversas inválida.');
    const resposta = await executarConsumo<BaseResponse<ConversaResumoBackend[]>>(
      `/conversas?pagina=${pagina}&por_pagina=20`, undefined,
    );
    return { conversas: resposta.dados, pagina: resposta.paginacao?.pagina ?? pagina,
      paginas: resposta.paginacao?.paginas ?? 1 };
  },

  obterConversa: async (id: number): Promise<ConversaDetalheBackend> => {
    validarIdConversa(id);
    const resposta = await executarConsumo<BaseResponse<ConversaDetalheBackend>>(
      `/conversas/${id}`, undefined,
    );
    return resposta.dados;
  },

  perguntarConversa: async (entrada: string, fonteIds: number[], id?: number): Promise<ConversaDetalheBackend> => {
    const pergunta = entrada.trim();
    if (!pergunta || pergunta.length > 2000) throw new Error('Use uma pergunta entre 1 e 2.000 caracteres.');
    if (!fonteIds.length || fonteIds.some(fid => !Number.isSafeInteger(fid) || fid < 1)) {
      throw new Error('Selecione ao menos uma fonte de dados válida para conversar.');
    }
    if (id !== undefined) validarIdConversa(id);
    const chave = useChaveConsumoStore.getState().chave;
    const resposta = await executarConsumo<BaseResponse<RespostaConversaBackend>>(
      '/conversas/perguntar', { method: 'POST', body: JSON.stringify({
        pergunta, fonte_dados_ids: [...new Set(fonteIds)], ...(id !== undefined ? { conversa_id: id } : {}),
      }) },
      chave,
    );
    if (useChaveConsumoStore.getState().chave !== chave) throw new Error('A chave de API foi alterada durante o envio.');
    const detalhe = await executarConsumo<BaseResponse<ConversaDetalheBackend>>(
      `/conversas/${resposta.dados.conversa_id}`, undefined, chave,
    );
    return detalhe.dados;
  },

  renomearConversa: async (id: number, entrada: string): Promise<ConversaResumoBackend> => {
    validarIdConversa(id);
    const titulo = entrada.trim();
    if (!titulo || titulo.length > 255) throw new Error('Use um título entre 1 e 255 caracteres.');
    const resposta = await executarConsumo<BaseResponse<ConversaResumoBackend>>(
      `/conversas/${id}`, { method: 'PATCH', body: JSON.stringify({ titulo }) },
    );
    return resposta.dados;
  },

  excluirConversa: async (id: number): Promise<void> => {
    validarIdConversa(id);
    await executarConsumo(`/conversas/${id}`, { method: 'DELETE' });
  },
};
