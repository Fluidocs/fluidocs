from abc import ABC, abstractmethod
from typing import List

class StrategyExtracaoBase(ABC):
    @abstractmethod
    def extrair_conteudo(caminho: str) -> str | List[dict]:
        raise NotImplementedError