import { create } from 'zustand';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  funcao: 'admin' | 'funcionario';
  gruposAcesso: string[];
}

interface EstadoAutenticacao {
  usuario: Usuario | null;
  estaAutenticado: boolean;
  entrar: (usuario: Usuario) => void;
  sair: () => void;
}

export const useAutenticacaoStore = create<EstadoAutenticacao>((set) => ({
  usuario: null,
  estaAutenticado: false,
  entrar: (usuario) => set({ usuario, estaAutenticado: true }),
  sair: () => set({ usuario: null, estaAutenticado: false }),
}));
