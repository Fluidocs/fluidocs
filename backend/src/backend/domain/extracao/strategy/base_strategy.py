from abc import ABC, abstractmethod


class StrategyExtracaoBase(ABC):
    @abstractmethod
    def extrair_conteudo(self, caminho: str) -> str:
        raise NotImplementedError
