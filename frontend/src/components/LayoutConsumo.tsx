import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta } from '../store/useGerenciamentoStore';
import { useFontesConsumoStore } from '../store/useFontesDadosStore';
import { useConsumoStore } from '../store/useConsumoStore';
import { useChaveConsumoStore } from '../store/useChaveConsumoStore';
import { AcessoConsumo } from './consumo/AcessoConsumo';
import { FaixaDemo } from './consumo/FaixaDemo';
import './gerenciamento/Gerenciamento.css';
import './consumo/Consumo.css';
import './consumo/Acme.css';

export function LayoutConsumo() {
  const { usuario, tokenAcesso, estaAutenticado } = useAutenticacaoStore();
  const { chave, limpar } = useChaveConsumoStore();
  const carregarFontes = useFontesConsumoStore(s => s.carregar);
  const carregarConversas = useConsumoStore(s => s.carregar);
  const ocupado = useConsumoStore(s => s.enviando || s.alterando);
  const { pathname } = useLocation();
  useEffect(() => {
    if (estaAutenticado && tokenAcesso && chave) void carregarFontes();
  }, [estaAutenticado, tokenAcesso, chave, carregarFontes]);
  useEffect(() => {
    if (estaAutenticado && tokenAcesso && chave && pathname === '/conversas') void carregarConversas();
  }, [estaAutenticado, tokenAcesso, chave, pathname, carregarConversas]);
  useEffect(() => {
    const anterior = document.title;
    document.title = `${pathname === '/busca' ? 'Busca de documentos' : 'Conversas'} · Acme`;
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, [pathname]);
  if (!estaAutenticado || !usuario) return <Navigate to="/entrar" replace />;
  if (!chave) return <AcessoConsumo key={`${identificarConta(usuario)}:${tokenAcesso}`} />;
  return <div className="gestao chat-route acme consumo-autenticado">
    <div className="consumo-chave-barra"><span><KeyRound size={15} aria-hidden="true" />Chave de API em uso nesta aba</span><button disabled={ocupado} onClick={() => limpar()}>Trocar chave</button></div>
    <Outlet key={identificarConta(usuario)} />
    <FaixaDemo />
  </div>;
}
