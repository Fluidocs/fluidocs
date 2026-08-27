import { create } from 'zustand';
import { DadosArquivo } from '../tipos';

export interface Repository {
  id: string;
  name: string;
  url: string;
  type: 'onedrive' | 'gdrive' | 'local';
  sectors: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachments?: DadosArquivo[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

export interface Sector {
  id: string;
  name: string;
}

interface DataState {
  repositories: Repository[];
  chats: ChatSession[];
  sectors: Sector[];
  addRepository: (repo: Omit<Repository, 'id'>) => void;
  updateRepository: (id: string, repo: Partial<Repository>) => void;
  removeRepository: (id: string) => void;
  addChatSession: (title: string) => string;
  addChatMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  removeChatSession: (id: string) => void;
}

export const useDataStore = create<DataState>((set) => ({
  repositories: [],
  chats: [
    { id: '1', title: 'Resumo de Contratos 2025', messages: [], updatedAt: Date.now() },
  ],
  sectors: [
    { id: 'admin', name: 'Administração' },
    { id: 'rh', name: 'Recursos Humanos' },
    { id: 'ti', name: 'Tecnologia da Informação' },
    { id: 'geral', name: 'Geral' },
  ],
  addRepository: (repo) => set((state) => ({
    repositories: [...state.repositories, { ...repo, id: Math.random().toString(36).substr(2, 9) }]
  })),
  updateRepository: (id, repoUpdate) => set((state) => ({
    repositories: state.repositories.map(r => r.id === id ? { ...r, ...repoUpdate } : r)
  })),
  removeRepository: (id) => set((state) => ({
    repositories: state.repositories.filter(r => r.id !== id)
  })),
  addChatSession: (title) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      chats: [{ id, title, messages: [], updatedAt: Date.now() }, ...state.chats]
    }));
    return id;
  },
  addChatMessage: (sessionId, message) => set((state) => ({
    chats: state.chats.map(chat => 
      chat.id === sessionId 
        ? { 
            ...chat, 
            messages: [...chat.messages, { ...message, id: Math.random().toString(36).substr(2, 9), timestamp: Date.now() }],
            updatedAt: Date.now()
          } 
        : chat
    )
  })),
  removeChatSession: (id) => set((state) => ({
    chats: state.chats.filter(c => c.id !== id)
  })),
}));
