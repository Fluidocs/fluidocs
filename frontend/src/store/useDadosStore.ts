import { create } from 'zustand';
import { DadosArquivo } from '../tipos';

export interface Repositorio {
  id: string;
  nome: string;
  url: string;
  tipo: 'onedrive' | 'gdrive' | 'local';
  gruposAcesso: string[];
}

export interface MensagemChat {
  id: string;
  papel: 'user' | 'assistant';
  conteudo: string;
  timestamp: number;
  anexos?: DadosArquivo[];
}

export interface SessaoChat {
  id: string;
  titulo: string;
  mensagens: MensagemChat[];
  atualizadoEm: number;
}

export interface GrupoAcesso {
  id: string;
  nome: string;
}

interface EstadoDados {
  repositorios: Repositorio[];
  chats: SessaoChat[];
  gruposAcesso: GrupoAcesso[];
  adicionarRepositorio: (repo: Omit<Repositorio, 'id'>) => void;
  inserirRepositorio: (repo: Repositorio) => void;
  definirRepositorios: (repositorios: Repositorio[]) => void;
  atualizarRepositorio: (id: string, repo: Partial<Repositorio>) => void;
  removerRepositorio: (id: string) => void;
  definirChats: (chats: SessaoChat[]) => void;
  definirSessaoChat: (chat: SessaoChat) => void;
  adicionarSessaoChat: (titulo: string) => string;
  adicionarMensagemChat: (idSessao: string, mensagem: Omit<MensagemChat, 'id' | 'timestamp'>) => void;
  removerSessaoChat: (id: string) => void;
  adicionarGrupoAcesso: (grupo: GrupoAcesso) => void;
  removerGrupoAcesso: (id: string) => void;
}

export const useDadosStore = create<EstadoDados>((set) => ({
  repositorios: [],
  chats: [],
  gruposAcesso: [
    { id: 'admin', nome: 'Administradores' },
    { id: 'rh', nome: 'Recursos Humanos' },
    { id: 'ti', nome: 'Tecnologia da Informação' },
    { id: 'geral', nome: 'Geral' },
  ],
  adicionarRepositorio: (repo) => set((state) => ({
    repositorios: [...state.repositorios, { ...repo, id: Math.random().toString(36).substr(2, 9) }]
  })),
  inserirRepositorio: (repo) => set((state) => ({
    repositorios: state.repositorios.some(repositorio => repositorio.id === repo.id)
      ? state.repositorios.map(repositorio => repositorio.id === repo.id ? repo : repositorio)
      : [...state.repositorios, repo]
  })),
  definirRepositorios: (repositorios) => set({ repositorios }),
  atualizarRepositorio: (id, repoUpdate) => set((state) => ({
    repositorios: state.repositorios.map(r => r.id === id ? { ...r, ...repoUpdate } : r)
  })),
  removerRepositorio: (id) => set((state) => ({
    repositorios: state.repositorios.filter(r => r.id !== id)
  })),
  definirChats: (chats) => set({ chats }),
  definirSessaoChat: (chat) => set((state) => ({
    chats: state.chats.some((item) => item.id === chat.id)
      ? state.chats.map((item) => item.id === chat.id ? chat : item)
      : [chat, ...state.chats],
  })),
  adicionarSessaoChat: (titulo) => {
    const id = crypto.randomUUID();
    set((state) => ({
      chats: [{ id, titulo, mensagens: [], atualizadoEm: Date.now() }, ...state.chats],
    }));
    return id;
  },
  adicionarMensagemChat: (idSessao, mensagem) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === idSessao 
        ? { 
            ...chat, 
            mensagens: [...chat.mensagens, { ...mensagem, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }],
            atualizadoEm: Date.now()
          } 
        : chat
    )
  })),
  removerSessaoChat: (id) => set((state) => ({
    chats: state.chats.filter(c => c.id !== id)
  })),
  adicionarGrupoAcesso: (grupo) => set((state) => ({
    gruposAcesso: [...state.gruposAcesso, grupo],
  })),
  removerGrupoAcesso: (id) => set((state) => ({
    gruposAcesso: state.gruposAcesso.filter((grupo) => grupo.id !== id),
  })),
}));
