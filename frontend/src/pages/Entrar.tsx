import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, FileText, Search, ArrowUpRight, Info } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { useDadosStore } from '../store/useDadosStore';
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
  const repositorios = useDadosStore((state) => state.repositorios);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [example, setExample] = useState(0);

  function accessDemo(address: string) {
    // Preserve the existing local demo session and destination selection.
    entrar({ id: '1', nome: 'João Silva', email: address, funcao: 'admin', gruposAcesso: ['admin', 'rh', 'ti', 'geral'] });
    navigate(repositorios.length > 0 ? '/busca' : '/repositorios');
  }
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    accessDemo(email);
  }

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
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field"><label htmlFor="login-email">E-mail</label><input id="login-email" name="email" type="email" autoComplete="username" placeholder="voce@exemplo.com" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <div className="login-field">
                <div className="login-label-row"><label htmlFor="login-password">Senha</label><button type="button" className="login-text-button" aria-expanded={showHelp} aria-controls="login-recovery" onClick={() => setShowHelp(!showHelp)}>Esqueceu a senha?</button></div>
                <div className="login-password"><input id="login-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Digite sua senha" required value={password} onChange={(event) => setPassword(event.target.value)} /><button type="button" aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}</button></div>
                {showHelp && <p id="login-recovery" className="login-help" role="status">A recuperação de senha ainda não está disponível. Explore a demonstração pelo botão abaixo, sem usar uma senha real.</p>}
              </div>
              <button type="submit" className="login-submit">Entrar no Fluidocs <ArrowRight size={19} aria-hidden="true" /></button>
            </form>
            <div className="login-divider"><span>ou conheça primeiro</span></div>
            <button type="button" className="login-demo" onClick={() => accessDemo('demo@example.com')}>Explorar demonstração <ArrowUpRight size={18} aria-hidden="true" /></button>
            <p className="login-signup">Primeira vez aqui? <Link to="/cadastrar">Criar uma conta</Link></p>
            <div className="login-notice"><Info size={16} aria-hidden="true" /><p>Ambiente de demonstração. O acesso é simulado; use apenas dados fictícios.</p></div>
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
