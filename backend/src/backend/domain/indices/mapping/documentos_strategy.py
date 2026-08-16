from typing import Any

from backend.config import config
from .base_strategy import MappingBase

class DocumentosStrategy(MappingBase):
    def __init__(
        self,
        numero_shards: int = 1,
        numero_replicas: int = 0,
        b: float = 0.7,
        k1: float = 0.6
    ):
        super().__init__(
            numero_shards=numero_shards,
            numero_replicas=numero_replicas
        )

        self.b = b
        self.k1 = k1


    def construir(self) -> dict[str, Any]:
        return self._settings() | self._mappings()
            

    def _settings(self) -> dict[str, Any]:
        settings = self._base_settings() | {
            'index': {
                'similarity': {
                    'default': {
                        'type': 'BM25',
                        'b': self.b,
                        'k1': self.k1
                    }
                }
            },
            'analysis': {
                'analyzer': {
                    'pt-BR': {
                        'type': 'portuguese'
                    }
                }
            }
        }

        return { 'settings': settings }
    
    
    def _mappings(
        self    
    ) -> dict[str, Any]:
        return {
            "mappings": {
                "dynamic": "strict",
                "properties": {
                    "nome_documento": {
                        "type": "keyword",
                    },
                    "id_repositorio": {
                        "type": "keyword",
                    },
                    "tipo_documento": {
                        "type": "keyword",
                    },
                    "conteudo": {
                        "type": "text",
                        "analyzer": "pt-BR",
                    },
                    "id_trecho": {
                        "type": "integer",
                    },
                    "embeddings": {
                        "type": "dense_vector",
                        "dims": config.hf_dimensionamento,
                        "similarity": "cosine",
                        "index": True,
                    },
                },
            }
        }