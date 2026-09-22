import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronDown, Code2, Database, FileText, Layers, Menu, RotateCcw, Search, ShieldCheck, Sparkles, Upload, X } from 'lucide-react';
import { AlternarTema } from '../components/AlternarTema';
import logo from '../assets/fluidocs-logo.png';
import './Inicio.css';

const navigation = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#experimente', label: 'Experimente' },
  { href: '#recursos', label: 'Recursos' },
];

const examples = [
  {
    name: 'Documentação', file: 'guia-de-integracao.pdf', section: 'Preparação da base', page: '04',
    question: 'Como os documentos ficam prontos para a busca?',
    intro: 'A preparação da base começa com o envio de um arquivo para uma fonte de dados.',
    excerpt: 'O conteúdo é extraído, dividido em trechos e transformado em vetores para a busca híbrida.',
    outro: 'O processamento acontece em segundo plano. Depois da indexação, os trechos podem ser recuperados nas consultas.',
    answer: 'Após o envio, o Fluidocs extrai o conteúdo, organiza os trechos e gera os vetores. Assim, seus documentos ficam preparados para consultas por termos e por significado.',
    terms: ['documentos', 'busca', 'vetores'],
  },
  {
    name: 'Base de conhecimento', file: 'manual-do-produto.pdf', section: 'Fontes de dados', page: '08',
    question: 'Como organizar documentos de assuntos diferentes?',
    intro: 'Uma base pode reunir documentos com diferentes finalidades e assuntos.',
    excerpt: 'As fontes de dados agrupam os documentos e permitem delimitar o contexto de uma consulta.',
    outro: 'Selecione a fonte relacionada ao assunto para consultar o conteúdo que faz sentido para aquela conversa.',
    answer: 'Organize os arquivos em fontes de dados por assunto. Ao consultar, selecione a fonte desejada para que a busca use aquele conjunto de documentos como contexto.',
    terms: ['fontes de dados', 'contexto', 'documentos'],
  },
  {
    name: 'Pesquisa', file: 'notas-de-pesquisa.txt', section: 'Recuperação de informação', page: '02',
    question: 'A busca encontra informações além das palavras exatas?',
    intro: 'Uma pergunta e um documento podem tratar do mesmo assunto com palavras diferentes.',
    excerpt: 'A busca híbrida combina correspondência lexical BM25 com proximidade semântica vetorial k-NN.',
    outro: 'Os trechos recuperados são utilizados como contexto para a geração de respostas com RAG.',
    answer: 'Sim. A busca combina termos exatos com proximidade de significado. Os trechos recuperados ajudam a construir uma resposta com contexto, mesmo quando a pergunta usa outras palavras.',
    terms: ['BM25', 'semântica', 'k-NN'],
  },
];

const steps = [
  { title: 'Conecte seu conhecimento.', text: 'Envie PDFs, textos e imagens. Organize tudo em fontes de dados que fazem sentido para sua aplicação.', icon: Upload, detail: 'Seus arquivos, organizados', description: 'Cada documento começa em uma fonte de dados. É ela que ajuda a definir o contexto das suas próximas consultas.', tags: ['PDF', 'TXT', 'Imagens'] },
  { title: 'Dê contexto à busca.', text: 'O Fluidocs prepara os documentos em segundo plano e combina termos exatos com proximidade de significado.', icon: Search, detail: 'Palavras + significado', description: 'A busca híbrida reúne correspondência lexical BM25 e busca vetorial k-NN para recuperar trechos relevantes.', tags: ['Extração', 'Embeddings', 'Busca híbrida'] },
  { title: 'Leve respostas ao seu sistema.', text: 'Integre a API e use os trechos recuperados como contexto para respostas com RAG.', icon: Code2, detail: 'Conhecimento que vira resposta', description: 'Sua aplicação faz a pergunta. O conteúdo recuperado da base dá contexto ao modelo para construir a resposta.', tags: ['API', 'Contexto', 'RAG'] },
];

function Brand() {
  return <Link to="/" className="inicio-brand" aria-label="Fluidocs — página inicial" onClick={() => window.scrollTo({ top: 0 })}>
    <img src={logo} width="31" height="36" alt="" /><span>fluidocs<span className="inicio-brand-dot">.</span></span>
  </Link>;
}

function DocumentPreview({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  const example = examples[selected];
  return <div className="inicio-document-scene">
    <div className="inicio-document-tabs" aria-label="Exemplos de documentos">
      {examples.map((item, index) => <button key={item.name} type="button" aria-pressed={selected === index} onClick={() => onSelect(index)}>{item.name}</button>)}
    </div>
    <div className="inicio-paper-stack">
      <article className="inicio-paper" key={example.file}>
        <div className="inicio-paper-top"><span><FileText size={15} /> {example.file}</span><ArrowUpRight size={17} aria-hidden="true" /></div>
        <div className="inicio-paper-content">
          <h2>{example.section}</h2>
          <p>{example.intro}</p>
          <p><mark>{example.excerpt}</mark></p>
          <p>{example.outro}</p>
          <div className="inicio-paper-foot"><span>Fonte de dados · Exemplo ilustrativo</span><span>{example.page}</span></div>
        </div>
      </article>
      <div className="inicio-annotation">
        <span className="inicio-annotation-icon"><Sparkles size={19} aria-hidden="true" /></span>
        <div><strong>A resposta começa aqui.</strong><p>Uma pergunta. O trecho certo. Mais contexto.</p><a href="#experimente">Veja esse exemplo <ArrowRight size={15} aria-hidden="true" /></a></div>
      </div>
    </div>
    <div className="inicio-scene-caption"><span className="inicio-status-dot" /> Do arquivo à resposta, com contexto.</div>
  </div>;
}

function Playground({ selected, onSelect }: { selected: number; onSelect: (index: number) => void }) {
  const [phase, setPhase] = useState(0);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const example = examples[selected];

  useEffect(() => { setPhase(0); setRunning(false); setSourceOpen(false); }, [selected]);
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(() => {
      setPhase(current => current + 1);
      if (phase >= 2) setRunning(false);
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 7000);
    return () => window.clearTimeout(timer);
  }, [phase, running]);

  return <section className="inicio-lab" id="experimente" aria-labelledby="lab-title">
    <div className="inicio-container">
      <div className="inicio-section-heading"><h2 id="lab-title">Menos procura.<br /><span>Mais respostas.</span></h2><div><p>Veja o conhecimento sair do arquivo.<br />Escolha um exemplo e acompanhe a consulta.</p><span className="inicio-demo-label"><span /> Demonstração interativa · dados fictícios</span></div></div>
      <div className="inicio-lab-layout">
        <div className="inicio-lab-input">
          <label htmlFor="inicio-example">O que você quer explorar?</label>
          <div className="inicio-select-wrap"><select id="inicio-example" value={selected} onChange={event => onSelect(Number(event.target.value))}>{examples.map((item, index) => <option key={item.name} value={index}>{item.name}</option>)}</select><ChevronDown size={18} aria-hidden="true" /></div>
          <div className="inicio-question"><Search size={21} aria-hidden="true" /><p>{example.question}</p></div>
          <button className="inicio-button inicio-button-lime" type="button" disabled={running} onClick={() => { setPhase(0); setSourceOpen(false); setRunning(true); }}>
            {running ? 'Consultando exemplo…' : phase === 3 ? 'Experimentar novamente' : 'Encontrar resposta'}{phase === 3 ? <RotateCcw size={17} aria-hidden="true" /> : <ArrowRight size={18} aria-hidden="true" />}
          </button>
          <p className="inicio-lab-note">Uma simulação local do fluxo. Para consultar seus próprios documentos, <Link to="/cadastrar">crie uma conta</Link>.</p>
        </div>
        <div className="inicio-lab-output" aria-busy={running}>
          <ol className="inicio-query-stages" aria-label="Etapas da consulta">
            {['Localizar', 'Contextualizar', 'Responder'].map((label, index) => <li key={label} className={phase > index ? 'is-complete' : ''}><span>{phase > index ? <Check size={13} aria-hidden="true" /> : index + 1}</span>{label}</li>)}
          </ol>
          <div className="inicio-response" aria-live="polite" aria-atomic="true">
            {phase === 0 && <div className="inicio-response-empty"><Layers size={34} strokeWidth={1.3} aria-hidden="true" /><h3>O conhecimento já está no arquivo.</h3><p>{running ? 'Localizando trechos relevantes…' : 'Faça a consulta para descobrir a resposta.'}</p></div>}
            {phase === 1 && <div className="inicio-response-intermediate"><Search size={25} aria-hidden="true" /><h3>Encontramos um trecho relevante.</h3><p>Combinando termos e significado no documento de exemplo.</p><div className="inicio-term-list">{example.terms.map(term => <span key={term}>{term}</span>)}</div></div>}
            {phase === 2 && <div className="inicio-response-intermediate"><FileText size={25} aria-hidden="true" /><h3>O documento dá o contexto.</h3><blockquote>{example.excerpt}</blockquote></div>}
            {phase === 3 && <div className="inicio-response-ready"><div className="inicio-response-title"><Sparkles size={19} aria-hidden="true" /><h3>Resposta com contexto</h3><span>Exemplo</span></div><p>{example.answer}</p><button type="button" className="inicio-citation" aria-expanded={sourceOpen} aria-controls="inicio-source-excerpt" onClick={() => setSourceOpen(!sourceOpen)}><FileText size={17} aria-hidden="true" /><span>{example.file}</span><ChevronDown size={16} className={sourceOpen ? 'is-open' : ''} aria-hidden="true" /></button><blockquote id="inicio-source-excerpt" hidden={!sourceOpen}><span>Trecho de origem · página {example.page}</span>{example.excerpt}</blockquote></div>}
          </div>
        </div>
      </div>
    </div>
  </section>;
}

export function Inicio() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const menuButton = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const step = steps[activeStep];
  const StepIcon = step.icon;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Fluidocs — Seu conhecimento em movimento';
    return () => { document.title = previousTitle; };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false);
    };
    const desktop = window.matchMedia('(min-width: 900px)');
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOutside); desktop.removeEventListener('change', closeOnDesktop); };
  }, [menuOpen]);

  return <div className="inicio-page">
    <a href="#conteudo" className="inicio-skip">Pular para o conteúdo</a>
    <header ref={header} className="inicio-header"><div className="inicio-container inicio-header-row">
      <Brand />
      <nav className="inicio-desktop-nav" aria-label="Navegação principal">{navigation.map(item => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
      <div className="inicio-header-actions"><AlternarTema /><Link to="/entrar" className="inicio-login">Entrar</Link><Link to="/cadastrar" className="inicio-button inicio-button-dark inicio-header-signup">Começar agora <ArrowUpRight size={16} aria-hidden="true" /></Link><button ref={menuButton} type="button" className="inicio-menu-button" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} aria-expanded={menuOpen} aria-controls="inicio-mobile-nav" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div><nav id="inicio-mobile-nav" className="inicio-mobile-nav" aria-label="Navegação móvel" hidden={!menuOpen}>{navigation.map(item => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}<Link to="/entrar">Entrar no painel</Link><Link to="/cadastrar">Criar conta <ArrowUpRight size={16} /></Link></nav></header>

    <main id="conteudo" tabIndex={-1}>
      <section className="inicio-hero" aria-labelledby="inicio-title"><div className="inicio-container inicio-hero-grid">
        <div className="inicio-hero-copy"><h1 id="inicio-title">Seus documentos.<br />Novas <span>possibilidades.</span></h1><p className="inicio-lead">Transforme arquivos em respostas que fazem sentido. Uma API para conectar busca inteligente e IA ao conhecimento da sua aplicação.</p><div className="inicio-hero-actions"><Link to="/cadastrar" id="hero-cta-signup" className="inicio-button inicio-button-blue">Começar a construir <ArrowUpRight size={19} aria-hidden="true" /></Link><a href="#experimente" className="inicio-text-link">Explore na prática <span><ArrowDown size={17} aria-hidden="true" /></span></a></div><p className="inicio-hero-note"><Code2 size={16} aria-hidden="true" /> Para quem desenvolve. Com o seu conhecimento.</p></div>
        <DocumentPreview selected={selected} onSelect={setSelected} />
      </div><div className="inicio-container inicio-hero-bottom"><span>Conhecimento parado? Coloque em movimento.</span><a href="#como-funciona">Conheça o Fluidocs <ArrowDown size={15} aria-hidden="true" /></a></div></section>

      <div className="inicio-flow-band" aria-label="Do documento à resposta"><div className="inicio-container"><span><FileText aria-hidden="true" /> Seus documentos</span><ArrowRight className="inicio-band-arrow" aria-hidden="true" /><span><Search aria-hidden="true" /> Busca inteligente</span><ArrowRight className="inicio-band-arrow" aria-hidden="true" /><span><Sparkles aria-hidden="true" /> Respostas com contexto</span></div></div>

      <section className="inicio-workflow inicio-section" id="como-funciona" aria-labelledby="workflow-title"><div className="inicio-container"><div className="inicio-section-heading"><h2 id="workflow-title">Do arquivo à resposta.<br /><span>Um fluxo que faz sentido.</span></h2><p>Você traz os documentos.<br />O Fluidocs conecta os pontos.</p></div><div className="inicio-workflow-grid"><div className="inicio-steps">{steps.map((item, index) => <button key={item.title} type="button" className={`inicio-step ${activeStep === index ? 'is-active' : ''}`} aria-pressed={activeStep === index} aria-controls="inicio-step-detail" onClick={() => setActiveStep(index)}><span className="inicio-step-number">0{index + 1}</span><span><strong>{item.title}</strong><span className="inicio-step-description">{item.text}</span></span><ArrowUpRight size={20} aria-hidden="true" /></button>)}</div><div className="inicio-step-visual" id="inicio-step-detail" aria-live="polite" aria-atomic="true"><div className="inicio-step-art" aria-hidden="true"><div className="inicio-orbit inicio-orbit-outer" /><div className="inicio-orbit inicio-orbit-inner" /><span className="inicio-orbit-node node-one"><FileText size={23} /></span><span className="inicio-orbit-node node-two"><Database size={22} /></span><span className="inicio-orbit-node node-three"><Code2 size={22} /></span><span className="inicio-core" key={activeStep}><StepIcon size={43} strokeWidth={1.4} /></span></div><div className="inicio-step-detail"><h3>{step.detail}</h3><p>{step.description}</p><div className="inicio-tag-list">{step.tags.map(tag => <span key={tag}>{tag}</span>)}</div></div></div></div></div></section>

      <Playground selected={selected} onSelect={setSelected} />

      <section className="inicio-section inicio-features-section" id="recursos" aria-labelledby="features-title"><div className="inicio-container"><div className="inicio-section-heading"><h2 id="features-title">Uma base inteligente.<br /><span>Muitas formas de criar.</span></h2><p>Da organização dos arquivos à integração.<br />O essencial para seu próximo projeto.</p></div><div className="inicio-features-grid"><article className="inicio-feature-main"><div className="inicio-feature-main-top"><Code2 size={30} strokeWidth={1.5} aria-hidden="true" /></div><h3>Seu sistema.<br />Nosso ponto de conexão.</h3><p>Leve a busca documental e as respostas com RAG para sua aplicação por meio da API. Use o painel para gerenciar suas fontes e conversas.</p><Link to="/cadastrar">Construa com o Fluidocs <ArrowUpRight size={19} aria-hidden="true" /></Link><div className="inicio-integration-map" aria-label="Sua aplicação se conecta à API Fluidocs e à sua base documental"><span><Code2 size={20} /> Sua aplicação</span><span className="inicio-map-line" /><strong>fluidocs.</strong><span className="inicio-map-line" /><span><Database size={20} /> Sua base</span></div></article><div className="inicio-feature-list">{[{ icon: Search, title: 'Além da palavra exata.', text: 'Busca híbrida para encontrar o que importa, combinando termos e significado.' }, { icon: Layers, title: 'Cada fonte no seu lugar.', text: 'Organize documentos em fontes de dados e escolha o contexto das consultas.' }, { icon: ShieldCheck, title: 'Sua base, seu contexto.', text: 'Documentos isolados por usuário e consultas vinculadas à sua base.' }, { icon: Sparkles, title: 'IA com conhecimento da fonte.', text: 'Respostas RAG usam os trechos recuperados como contexto para o modelo.' }].map(({ icon: Icon, title, text }) => <article key={title}><Icon size={23} strokeWidth={1.6} aria-hidden="true" /><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></div></section>

      <section className="inicio-stack" id="tecnologia" aria-labelledby="stack-title"><div className="inicio-container"><h2 id="stack-title">Tecnologia que conecta<br />cada parte do fluxo.</h2><dl>{[{ name: 'FastAPI', role: 'Integração' }, { name: 'Elasticsearch', role: 'Busca híbrida' }, { name: 'PostgreSQL', role: 'Persistência' }, { name: 'Ollama', role: 'Modelos locais' }].map(item => <div key={item.name}><dt>{item.name}</dt><dd>{item.role}</dd></div>)}</dl></div></section>

      <section className="inicio-section inicio-faq" aria-labelledby="faq-title"><div className="inicio-container inicio-faq-grid"><div><h2 id="faq-title">Um pouco mais<br />de contexto.</h2><p>Antes de começar, algumas respostas.</p></div><div>{[{ question: 'O que posso construir com o Fluidocs?', answer: 'Você pode integrar busca documental e conversas com contexto aos seus sistemas. Uma base de documentação técnica, materiais de estudo ou manuais de produto são exemplos de conteúdos que podem apoiar essas experiências.' }, { question: 'Como funciona a busca híbrida?', answer: 'Ela combina dois caminhos: a busca lexical BM25 identifica correspondências entre termos, e a busca vetorial k-NN considera a proximidade de significado. Os trechos recuperados podem ser usados como contexto para as respostas com RAG.' }, { question: 'Preciso integrar a API para experimentar?', answer: 'A demonstração desta página funciona sem cadastro e usa dados fictícios. Para usar seus próprios arquivos, crie uma conta e acesse o painel para organizar as fontes de dados e explorar as consultas e conversas.' }, { question: 'Onde os modelos de IA são executados?', answer: 'A arquitetura do Fluidocs utiliza o Ollama para executar os modelos localmente no ambiente configurado para o backend. O painel se conecta a esse ambiente pela API.' }].map(item => <details key={item.question}><summary>{item.question}<span><ChevronDown size={18} aria-hidden="true" /></span></summary><p>{item.answer}</p></details>)}</div></div></section>

      <section className="inicio-cta" aria-labelledby="cta-title"><div className="inicio-container"><div><h2 id="cta-title">Seu conhecimento<br />pode ir <span>mais longe.</span></h2><p>Conecte seus documentos à próxima ideia.</p></div><div className="inicio-cta-actions"><Link to="/cadastrar" id="cta-bottom-signup" className="inicio-button inicio-button-lime">Criar minha conta <ArrowUpRight size={20} aria-hidden="true" /></Link><Link to="/entrar">Já tenho uma conta <ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>
    </main>
    <footer className="inicio-footer"><div className="inicio-container"><div className="inicio-footer-top"><Brand /><p>Conhecimento em movimento.</p><a href="#conteudo">Voltar ao topo <ArrowUpRight size={16} aria-hidden="true" /></a></div><div className="inicio-footer-bottom"><span>© {new Date().getFullYear()} Fluidocs · FHO — Sistemas de Informação</span><nav aria-label="Navegação do rodapé"><a href="#experimente">Demonstração</a><a href="#tecnologia">Tecnologia</a><Link to="/entrar">Acessar painel</Link></nav></div></div></footer>
  </div>;
}
