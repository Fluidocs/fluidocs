import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from './api';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';

const usuario = { id: '7', nome: 'Conta de teste', email: 'teste@example.com' };

describe('contrato de autenticação HTTP', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    useAutenticacaoStore.getState().sair();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    useAutenticacaoStore.getState().sair();
    vi.unstubAllGlobals();
  });

  it('cria a conta no backend por JSON, sem token antigo nem sessão fictícia', async () => {
    useAutenticacaoStore.getState().entrar(usuario, 'token-anterior-ficticio');
    fetchMock.mockResolvedValue(Response.json({ dados: { nome: usuario.nome, email: usuario.email } }, { status: 201 }));
    expect(await api.cadastrar({ nome: ' Conta de teste ', email: ' teste@example.com ', senha: ' senha&+=á ' })).toEqual({
      nome: usuario.nome, email: usuario.email,
    });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/auth/cadastrar');
    expect(opcoes.method).toBe('POST');
    expect(new Headers(opcoes.headers).get('Content-Type')).toBe('application/json');
    expect(new Headers(opcoes.headers).has('Authorization')).toBe(false);
    expect(JSON.parse(opcoes.body as string)).toEqual({ nome: usuario.nome, email: usuario.email, senha: ' senha&+=á ' });
    expect(useAutenticacaoStore.getState().tokenAcesso).toBe('token-anterior-ficticio');
  });

  it('propaga a rejeição do cadastro sem autenticar uma conta inexistente', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'Ja existe um usuario cadastrado com este e-mail.' }, { status: 409 }));
    await expect(api.cadastrar({ ...usuario, senha: 'senha-ficticia' })).rejects.toMatchObject({ status: 409 });
    fetchMock.mockResolvedValueOnce(Response.json({ detail: [{ loc: ['body', 'senha'], msg: 'Senha invalida' }] }, { status: 422 }));
    await expect(api.cadastrar({ ...usuario, senha: 'curta' })).rejects.toMatchObject({ status: 422 });
    expect(useAutenticacaoStore.getState()).toMatchObject({ usuario: null, tokenAcesso: null, estaAutenticado: false });
  });

  it('envia o e-mail como username e preserva os caracteres da senha no formulário OAuth2', async () => {
    useAutenticacaoStore.getState().entrar(usuario, 'token-anterior-ficticio');
    fetchMock.mockResolvedValue(Response.json({ access_token: 'token-ficticio', token_type: 'bearer' }));
    expect(await api.autenticar(' teste@example.com ', ' senha&+=á ')).toEqual({
      access_token: 'token-ficticio', token_type: 'bearer',
    });
    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/auth/login');
    expect(opcoes.method).toBe('POST');
    expect(new Headers(opcoes.headers).get('Content-Type')).toBe('application/x-www-form-urlencoded');
    expect(new Headers(opcoes.headers).has('Authorization')).toBe(false);
    expect(new URLSearchParams(opcoes.body as URLSearchParams).get('username')).toBe('teste@example.com');
    expect(new URLSearchParams(opcoes.body as URLSearchParams).get('password')).toBe(' senha&+=á ');
  });

  it('carrega a conta real em /me usando o token recebido, sem inventar permissões', async () => {
    fetchMock.mockResolvedValue(Response.json({ dados: { ...usuario, id: 7, foto_perfil: null } }));
    expect(await api.obterUsuarioAtual('token-ficticio')).toEqual(usuario);
    expect(fetchMock.mock.calls[0][0]).toBe('/me');
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token-ficticio');
    expect(useAutenticacaoStore.getState().estaAutenticado).toBe(false);
  });

  it('encaminha o JWT nas demais chamadas e remove a sessão quando o backend o rejeita', async () => {
    useAutenticacaoStore.getState().entrar(usuario, 'token-ficticio');
    fetchMock.mockResolvedValue(Response.json({ detail: 'Token de autenticacao invalido.' }, { status: 401 }));
    await expect(api.listarRepositorios()).rejects.toMatchObject({ status: 401 });
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('Authorization')).toBe('Bearer token-ficticio');
    expect(useAutenticacaoStore.getState()).toMatchObject({ usuario: null, tokenAcesso: null, estaAutenticado: false });
  });

  it('preserva uma nova sessão quando uma chamada antiga retorna 401', async () => {
    let responder: (resposta: Response) => void;
    useAutenticacaoStore.getState().entrar(usuario, 'token-antigo-ficticio');
    fetchMock.mockReturnValue(new Promise(resolve => { responder = resolve; }));
    const chamada = api.listarRepositorios();
    useAutenticacaoStore.getState().entrar(usuario, 'token-novo-ficticio');
    responder(Response.json({ detail: 'Token invalido.' }, { status: 401 }));
    await expect(chamada).rejects.toMatchObject({ status: 401 });
    expect(useAutenticacaoStore.getState().tokenAcesso).toBe('token-novo-ficticio');
  });

  it('não autentica credenciais rejeitadas ou uma conexão indisponível', async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ detail: 'E-mail ou senha invalidos.' }, { status: 401 }));
    await expect(api.autenticar(usuario.email, 'senha-ficticia')).rejects.toMatchObject({ status: 401 });
    fetchMock.mockRejectedValueOnce(new TypeError('Conexão indisponível'));
    await expect(api.autenticar(usuario.email, 'senha-ficticia')).rejects.toMatchObject({ status: 0 });
    expect(useAutenticacaoStore.getState()).toMatchObject({ usuario: null, tokenAcesso: null, estaAutenticado: false });
  });
});
