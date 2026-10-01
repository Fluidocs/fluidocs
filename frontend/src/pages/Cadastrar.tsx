import { useRef, useState, type FormEvent } from 'react';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, FileText, Search } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { api, type ErroAPI } from '../services/api';
import { AlternarTema } from '../components/AlternarTema';
import logo from '../assets/fluidocs-logo.png';
import './Entrar.css';
import './Cadastrar.css';

export function Cadastrar() {
  const navegar = useNavigate();
  const { entrar, estaAutenticado } = useAutenticacaoStore();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [contaCriada, setContaCriada] = useState(false);
  const [erro, setErro] = useState('');
  const enviando = useRef(false);

  const lidarComCadastro = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (enviando.current) return;
    if (!nome.trim()) {
      setErro('Informe seu nome completo.');
      return;
    }
    enviando.current = true;
    setCarregando(true);
    setErro('');
    let cadastroConfirmado = contaCriada;
    try {
      if (!cadastroConfirmado) {
        await api.cadastrar({ nome, email, senha });
        cadastroConfirmado = true;
        setContaCriada(true);
      }
      const token = await api.autenticar(email, senha);
      const usuario = await api.obterUsuarioAtual(token.access_token);
      entrar(usuario, token.access_token);
      navegar('/hub', { replace: true });
    } catch (falha) {
      const erroAPI = falha as ErroAPI;
      if (cadastroConfirmado) {
        setErro('Sua conta foi criada, mas não foi possível entrar automaticamente. Tente novamente ou use Fazer login.');
      } else if (erroAPI?.status === 409) {
        setErro('Já existe uma conta com esse e-mail. Use Fazer login para acessar.');
      } else if (erroAPI?.status === 422) {
        setErro('Os dados informados são inválidos. Confira seu nome, e-mail e senha.');
      } else if (erroAPI?.status === 0) {
        setErro('Não foi possível conectar ao servidor. Tente novamente em instantes.');
      } else {
        setErro('Não foi possível criar sua conta. Tente novamente em instantes.');
      }
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  };

  if (estaAutenticado) return <Navigate to="/hub" replace />;

  return (
    <div className="login-page cadastro-page">
      <header className="login-header">
        <Link to="/" className="login-brand" aria-label="Fluidocs — início">
          <img src={logo} alt="" width="36" height="40" />
          <span>fluidocs<span className="login-brand-dot">.</span></span>
        </Link>
        <div className="login-header-actions">
          <Link to="/" className="login-back" aria-label="Voltar ao início">
            <ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao início</span>
          </Link>
          <AlternarTema />
        </div>
      </header>
      <main className="login-layout">
        <section className="login-form-panel" aria-labelledby="cadastro-title">
          <div className="login-form-content">
            <h1 id="cadastro-title">Crie sua conta<br /><span>empresarial.</span></h1>
            <p className="login-intro">Comece a organizar o conhecimento da sua empresa</p>
            <form onSubmit={lidarComCadastro} className="login-form" aria-busy={carregando}>
              <div className="login-field">
                <label htmlFor="cadastro-nome">Nome completo</label>
                <input id="cadastro-nome" name="nome" type="text" autoComplete="name" value={nome} onChange={(event) => { setNome(event.target.value); setErro(''); }} placeholder="João Silva" required maxLength={60} disabled={carregando} readOnly={contaCriada} />
              </div>
              <div className="login-field">
                <label htmlFor="cadastro-email">E-mail corporativo</label>
                <input id="cadastro-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setErro(''); }} placeholder="joao@acme.com" required maxLength={100} disabled={carregando} readOnly={contaCriada} />
              </div>
              <div className="login-field">
                <label htmlFor="cadastro-senha">Senha</label>
                <div className="login-password">
                  <input id="cadastro-senha" name="senha" type={mostrarSenha ? 'text' : 'password'} autoComplete="new-password" value={senha} onChange={(event) => { setSenha(event.target.value); setErro(''); }} placeholder="Crie sua senha" aria-describedby="cadastro-senha-ajuda" required minLength={8} maxLength={128} disabled={carregando} />
                  <button type="button" aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha} onClick={() => setMostrarSenha(!mostrarSenha)}>
                    {mostrarSenha ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                <p id="cadastro-senha-ajuda" className="cadastro-field-help">Use de 8 a 128 caracteres.</p>
              </div>
              {contaCriada && <p className="cadastro-field-help" role="status">Sua conta já foi criada no servidor. Agora falta entrar.</p>}
              {erro && <p className="login-error" role="alert">{erro}</p>}
              <button type="submit" className="login-submit" disabled={carregando}>{carregando ? (contaCriada ? 'Entrando…' : 'Criando conta…') : (contaCriada ? 'Entrar na conta' : 'Criar conta')} <ArrowRight size={19} aria-hidden="true" /></button>
            </form>
            <p className="login-signup">Já tem uma conta? <Link to="/entrar">Fazer login</Link></p>
          </div>
        </section>
        <aside className="login-story" aria-label="Conheça o Fluidocs">
          <div className="login-story-heading">
            <h2>Menos procura.<br />Mais descoberta.</h2>
            <p>Dos seus documentos à resposta que você precisa.</p>
          </div>
          <div className="login-example">
            <div className="login-example-top">
              <span><FileText size={18} aria-hidden="true" /> Biblioteca de conhecimento</span>
              <span className="login-example-caption">Exemplo ilustrativo</span>
            </div>
            <div className="login-question"><Search size={19} aria-hidden="true" /><span>De onde vêm as respostas?</span></div>
            <div className="login-answer">
              <span className="login-answer-label">Uma resposta, com contexto.</span>
              <p>O assistente usa os trechos recuperados dos documentos como contexto para elaborar uma resposta.</p>
              <div className="login-source">
                <FileText size={18} aria-hidden="true" />
                <span>Guia do assistente<small>Documento de exemplo</small></span>
                <span>p. 12</span>
              </div>
            </div>
          </div>
          <div className="login-story-bottom"><span>Documentos conectados ao que importa.</span></div>
        </aside>
      </main>
      <footer className="login-footer"><span>© {new Date().getFullYear()} Fluidocs</span><span>Conhecimento que flui.</span></footer>
    </div>
  );
}
