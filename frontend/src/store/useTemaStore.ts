import { create } from 'zustand';

interface EstadoTema {
  tema: 'light' | 'dark';
  alternarTema: () => void;
}

export const useTemaStore = create<EstadoTema>((set) => ({
  tema: 'light',
  alternarTema: () =>
    set((state) => {
      const novoTema = state.tema === 'light' ? 'dark' : 'light';
      if (novoTema === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { tema: novoTema };
    }),
}));
