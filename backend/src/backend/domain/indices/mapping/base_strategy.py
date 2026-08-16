from abc import ABC, abstractmethod
from typing import Any

class MappingBase(ABC):
    def __init__(
        self,
        numero_shards: int = 1,
        numero_replicas: int = 0
    ):
        self._number_of_shards = numero_shards
        self._number_of_replicas = numero_replicas


    @abstractmethod
    def construir(self) -> dict[str, Any]:
        raise NotImplementedError


    def _base_settings(self) -> dict[str, Any]:
            return {
                'number_of_shards': self._number_of_shards,
                'number_of_replicas': self._number_of_replicas
            }

