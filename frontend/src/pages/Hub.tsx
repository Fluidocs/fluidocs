import { useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ArrowRight, Database, KeyRound, LogOut, MessageSquare, Search, SlidersHorizontal } from 'lucide-react';
import { AlternarTema } from '../components/AlternarTema';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import logo from '../assets/fluidocs-logo.png';
import './Hub.css';

export function Hub() {
  const { estaAutenticado, usuario, sair } = useAutenticacaoStore();

  useEffect(() => {
    const tituloAnterior = document.title;
    document.title = 'Escolha um módulo · Fluidocs';
    window.scrollTo(0, 0);
    return () => { document.title = tituloAnterior; };
  }, []);

  if (!estaAutenticado) return <Navigate to="/entrar" replace />;

  return (
    <div className="hub-page">
      <a className="hub-skip" href="#hub-conteudo">Pular para a seleção de módulos</a>
      <header className="hub-header">
        <Link className="hub-brand" to="/" aria-label="Fluidocs — início">
          <img src={logo} width="30" height="36" alt="" />
          <span>fluidocs<span className="hub-brand-dot">.</span></span>
        </Link>
        <div className="hub-account">
          <span className="hub-account-name" title={usuario?.nome}>{usuario?.nome || 'Minha conta'}</span>
          <AlternarTema />
          <button className="hub-signout" type="button" onClick={sair}><LogOut size={17} aria-hidden="true" />Sair</button>
        </div>
      </header>

      <main id="hub-conteudo" className="hub-main" tabIndex={-1}>
        <div className="hub-intro">
          <h1>Como você quer usar<br className="hub-title-break" /> o Fluidocs?</h1>
          <p>Consulte seus documentos ou configure os recursos da sua conta.</p>
        </div>

        <nav className="hub-modules" aria-label="Seleção de módulos">
          <Link className="hub-module" to="/busca" aria-labelledby="hub-consumo-title" aria-describedby="hub-consumo-description">
            <div className="hub-module-heading">
              <Search size={30} strokeWidth={1.6} aria-hidden="true" />
              <h2 id="hub-consumo-title">Busca e conversas</h2>
            </div>
            <p id="hub-consumo-description" className="hub-module-description">Encontre informações nos documentos e converse com o assistente sobre o que você precisa saber.</p>
            <ul className="hub-features" aria-label="Recursos de busca e conversas">
              <li><Search size={18} aria-hidden="true" />Pesquisa de documentos</li>
              <li><MessageSquare size={18} aria-hidden="true" />Conversas com o assistente</li>
            </ul>
            <span className="hub-module-action">Acessar busca e conversas<ArrowRight size={20} aria-hidden="true" /></span>
          </Link>

          <Link className="hub-module" to="/fontes-de-dados" aria-labelledby="hub-gerenciamento-title" aria-describedby="hub-gerenciamento-description">
            <div className="hub-module-heading">
              <SlidersHorizontal size={30} strokeWidth={1.6} aria-hidden="true" />
              <h2 id="hub-gerenciamento-title">Gerenciamento</h2>
            </div>
            <p id="hub-gerenciamento-description" className="hub-module-description">Organize suas fontes de dados e gerencie as chaves de API da sua conta.</p>
            <ul className="hub-features" aria-label="Recursos de gerenciamento">
              <li><Database size={18} aria-hidden="true" />Fontes de dados</li>
              <li><KeyRound size={18} aria-hidden="true" />Chaves de API</li>
            </ul>
            <span className="hub-module-action">Acessar gerenciamento<ArrowRight size={20} aria-hidden="true" /></span>
          </Link>
        </nav>

        <p className="hub-switch-hint">Sua conta acessa os dois módulos. Use <strong>Trocar módulo</strong> no menu para voltar aqui.</p>
      </main>

    </div>
  );
}
