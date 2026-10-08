import { create } from 'zustand';
import { useAutenticacaoStore } from './useAutenticacaoStore';

interface EstadoChaveConsumo {
  chave: string;
  erro: string;
  usar: (chave: string) => void;
  limpar: (erro?: string) => void;
}

// O segredo fica apenas em memória; não entra no armazenamento do navegador.
export const useChaveConsumoStore = create<EstadoChaveConsumo>(set => ({
  chave: '', erro: '',
  usar: entrada => {
    const chave = entrada.trim();
    if (!chave || /\s/.test(chave)) throw new Error('Informe o valor completo da sua chave de API, sem espaços.');
    set({ chave, erro: '' });
  },
  limpar: (erro = '') => set({ chave: '', erro }),
}));

useAutenticacaoStore.subscribe((sessao, anterior) => {
  if (sessao.tokenAcesso !== anterior.tokenAcesso || sessao.usuario?.id !== anterior.usuario?.id ||
      sessao.usuario?.email !== anterior.usuario?.email) useChaveConsumoStore.getState().limpar();
});
