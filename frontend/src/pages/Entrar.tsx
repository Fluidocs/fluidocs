import { useRef, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, FileText, Search, ArrowUpRight } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { api, type ErroAPI } from '../services/api';
import { AlternarTema } from '../components/AlternarTema';
import logo from '../assets/fluidocs-logo.png';
import './Entrar.css';

const examples = [
  { title: 'Como funciona a indexação?', answer: 'O processamento prepara os documentos para encontrar os trechos relevantes em uma busca.', source: 'Guia de indexação', page: 'p. 04' },
  { title: 'O que é uma busca híbrida?', answer: 'Ela combina a busca por palavras com a similaridade de significado para recuperar trechos dos documentos.', source: 'Conceitos de busca', page: 'p. 08' },
  { title: 'De onde vêm as respostas?', answer: 'O assistente usa os trechos recuperados dos documentos como contexto para elaborar uma resposta.', source: 'Guia do assistente', page: 'p. 12' },
];

export function Login() {
  const navigate = useNavigate();
  const entrar = useAutenticacaoStore((state) => state.entrar);
  const estaAutenticado = useAutenticacaoStore((state) => state.estaAutenticado);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [example, setExample] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const enviando = useRef(false);

  function accessExample() {
    if (enviando.current) return;
    entrar({ id: 'demo', nome: 'Conta de demonstração', email: 'demo@example.com' });
    navigate('/hub', { replace: true });
  }
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (enviando.current) return;
    enviando.current = true;
    setCarregando(true);
    setErro('');
    try {
      const token = await api.autenticar(email, password);
      const usuario = await api.obterUsuarioAtual(token.access_token);
      entrar(usuario, token.access_token);
      navigate('/hub', { replace: true });
    } catch (falha) {
      const erroAPI = falha as ErroAPI;
      setErro(erroAPI?.status === 401
        ? 'E-mail ou senha inválidos. Confira seus dados e tente novamente.'
        : erroAPI?.status === 0
          ? 'Não foi possível conectar ao servidor. Tente novamente em instantes.'
          : 'Não foi possível entrar no Fluidocs. Tente novamente em instantes.');
    } finally {
      enviando.current = false;
      setCarregando(false);
    }
  }

  if (estaAutenticado) return <Navigate to="/hub" replace />;

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-brand" aria-label="Fluidocs — início"><img src={logo} alt="" width="36" height="40" /><span>fluidocs<span className="login-brand-dot">.</span></span></Link>
        <div className="login-header-actions"><Link to="/" className="login-back" aria-label="Voltar ao início"><ArrowLeft size={16} aria-hidden="true" /><span>Voltar ao início</span></Link><AlternarTema /></div>
      </header>
      <main className="login-layout">
        <section className="login-form-panel" aria-labelledby="login-title">
          <div className="login-form-content">
            <h1 id="login-title">Seu conhecimento.<br /><span>Seu próximo passo.</span></h1>
            <p className="login-intro">Entre para continuar de onde você parou.</p>
            <form onSubmit={handleSubmit} className="login-form" aria-busy={carregando}>
              <div className="login-field"><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" placeholder="voce@exemplo.com" required disabled={carregando} value={email} onChange={(event) => { setEmail(event.target.value); setErro(''); }} /></div>
              <div className="login-field">
                <div className="login-label-row"><label htmlFor="login-password">Senha</label><button type="button" className="login-text-button" aria-expanded={showHelp} aria-controls="login-recovery" onClick={() => setShowHelp(!showHelp)}>Esqueceu a senha?</button></div>
                <div className="login-password"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required disabled={carregando} value={password} onChange={(event) => { setPassword(event.target.value); setErro(''); }} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
                {showHelp && <p id="login-recovery" className="login-help" role="status">A recuperação de senha ainda não está disponível. O acesso sem senha abaixo abre apenas uma demonstração local.</p>}
              </div>
              {erro && <p className="login-error" role="alert">{erro}</p>}
              <button type="submit" className="login-submit" disabled={carregando}>{carregando ? 'Entrando…' : 'Entrar no Fluidocs'} <ArrowRight size={19} aria-hidden="true" /></button>
            </form>
            <div className="login-divider"><span>ou conheça primeiro</span></div>
            <button type="button" className="login-demo" disabled={carregando} onClick={accessExample}>Continuar em demonstração <ArrowUpRight size={18} aria-hidden="true" /></button>
            <p className="login-demo-notice">A demonstração usa dados fictícios neste navegador.</p>
            <p className="login-signup">Primeira vez aqui? <Link to="/cadastrar">Criar uma conta</Link></p>
          </div>
        </section>
        <aside className="login-story" aria-label="Conheça o Fluidocs">
          <div className="login-story-heading"><h2>Menos procura.<br />Mais descoberta.</h2><p>Dos seus documentos à resposta que você precisa.</p></div>
          <div className="login-example">
            <div className="login-example-top"><span><FileText size={18} aria-hidden="true" /> Biblioteca de conhecimento</span><span className="login-example-caption">Exemplo ilustrativo</span></div>
            <div className="login-question"><Search size={19} aria-hidden="true" /><span>{examples[example].title}</span></div>
            <div className="login-answer" aria-live="polite" aria-atomic="true"><span className="login-answer-label">Uma resposta, com contexto.</span><p>{examples[example].answer}</p><div className="login-source"><FileText size={18} aria-hidden="true" /><span>{examples[example].source}<small>Documento de exemplo</small></span><span>{examples[example].page}</span></div></div>
          </div>
          <div className="login-story-bottom"><div className="login-example-controls" aria-label="Exemplos de busca">{examples.map((item, index) => <button key={item.title} type="button" aria-label={`Ver exemplo: ${item.title}`} aria-pressed={example === index} onClick={() => setExample(index)}><span /></button>)}</div><span>Documentos conectados ao que importa.</span></div>
        </aside>
      </main>
      <footer className="login-footer"><span>© {new Date().getFullYear()} Fluidocs</span><span>Conhecimento que flui.</span></footer>
    </div>
  );
}
