import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { KeyRound } from 'lucide-react';
import { useAutenticacaoStore } from '../store/useAutenticacaoStore';
import { identificarConta } from '../store/useGerenciamentoStore';
import { useFontesConsumoStore } from '../store/useFontesDadosStore';
import { CHAVE_CONSUMO, useConsumoStore } from '../store/useConsumoStore';
import { useChaveConsumoStore } from '../store/useChaveConsumoStore';
import { AcessoConsumo } from './consumo/AcessoConsumo';
import './gerenciamento/Gerenciamento.css';
import './consumo/Consumo.css';

export function LayoutConsumo() {
  const { usuario, tokenAcesso, estaAutenticado } = useAutenticacaoStore();
  const { chave, limpar } = useChaveConsumoStore();
  const carregarFontes = useFontesConsumoStore(s => s.carregar);
  const carregarConversas = useConsumoStore(s => s.carregar);
  const { pathname } = useLocation();
  useEffect(() => {
    if (estaAutenticado && tokenAcesso && chave) void carregarFontes();
  }, [estaAutenticado, tokenAcesso, chave, carregarFontes]);
  useEffect(() => {
    if (estaAutenticado && tokenAcesso && chave && pathname === '/conversas') void carregarConversas();
  }, [estaAutenticado, tokenAcesso, chave, pathname, carregarConversas]);
  useEffect(() => {
    if (!estaAutenticado || !tokenAcesso || !chave) return;
    const sincronizar = (e: StorageEvent) => {
      if (e.key === CHAVE_CONSUMO || e.key === null) carregarConversas();
    };
    window.addEventListener('storage', sincronizar);
    return () => window.removeEventListener('storage', sincronizar);
  }, [estaAutenticado, tokenAcesso, chave, carregarConversas]);
  useEffect(() => {
    const anterior = document.title;
    document.title = `${pathname === '/busca' ? 'Busca de documentos' : 'Conversas'} · Prisma Norte`;
    window.scrollTo(0, 0);
    return () => { document.title = anterior; };
  }, [pathname]);
  if (!estaAutenticado || !usuario) return <Navigate to="/entrar" replace />;
  if (!chave) return <AcessoConsumo key={`${identificarConta(usuario)}:${tokenAcesso}`} />;
  return <div className="gestao chat-route prisma-norte consumo-autenticado">
    <div className="consumo-chave-barra"><span><KeyRound size={15} aria-hidden="true" />Chave de API em uso nesta aba</span><button onClick={() => limpar()}>Trocar chave</button></div>
    <Outlet key={identificarConta(usuario)} />
  </div>;
}
