from abc import ABC, abstractmethod
from collections.abc import Iterable, Sequence
from typing import Any


class IndexacaoBase(ABC):
    @abstractmethod
    def construir_acoes(
        self,
        *,
        nome_indice: str,
        nome_arquivo: str,
        tipo_arquivo: str,
        trechos: Sequence[str],
        embeddings: Sequence[Sequence[float]],
        inicio_trecho: int = 0,
    ) -> Iterable[dict[str, Any]]:
        """Constrói ações compatíveis com o bulk do Elasticsearch."""
        raise NotImplementedError
