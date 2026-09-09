export interface DadosArquivo {
  id: number | string;
  titulo: string;
  tipo: string;
  repositorio: string;
  pontuacao?: number;
  data?: string;
  trecho?: string;
  tamanho?: string;
  autor?: string;
}
