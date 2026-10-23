import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { useChaveConsumoStore } from '../../store/useChaveConsumoStore';
import { AlternarTema } from '../AlternarTema';
import { FaixaDemo } from './FaixaDemo';
import logo from '../../assets/acme-logo.svg';

export function AcessoConsumo() {
  const { usar, erro: erroChave } = useChaveConsumoStore();
  const [valor, setValor] = useState('');
  const [erro, setErro] = useState('');
  function conectar(e: FormEvent) {
    e.preventDefault();
    try { usar(valor); setValor(''); }
    catch (e) { setErro(e instanceof Error ? e.message : 'Confira sua chave e tente novamente.'); }
  }
  return <div className="gestao consumo-acesso acme">
    <header className="consumo-acesso-topo"><Link to="/hub" className="consumo-link"><ArrowLeft size={17} />Trocar módulo</Link><AlternarTema /></header>
    <main className="consumo-acesso-conteudo">
      <div className="consumo-acesso-marca"><img src={logo} alt="" /><span>Acme</span></div>
      <KeyRound size={28} strokeWidth={1.5} aria-hidden="true" />
      <h1>Conecte sua chave de API</h1>
      <p>Use uma chave da sua conta para pesquisar documentos e conversar com suas fontes.</p>
      <form onSubmit={conectar}>
        <label htmlFor="consumo-chave">Chave de API</label>
        <input id="consumo-chave" type="password" autoComplete="off" spellCheck={false} autoCapitalize="none" required value={valor}
          onChange={e => { setValor(e.target.value); setErro(''); }} aria-describedby="consumo-chave-ajuda" aria-invalid={!!(erro || erroChave)} />
        <p id="consumo-chave-ajuda">A chave fica apenas nesta aba até você recarregar a página ou sair.</p>
        {(erro || erroChave) && <p className="gestao-error" role="alert">{erro || erroChave}</p>}
        <button className="gestao-button gestao-button-primary" disabled={!valor.trim()}>Usar minha chave</button>
      </form>
      <p>Ainda não tem uma chave? <Link to="/chaves-api" className="consumo-link">Criar no gerenciamento</Link></p>
    </main>
    <FaixaDemo />
  </div>;
}
