from typing import Any
from .configuracao_mapper import ConfiguracaoMapperDocumentos

class MapperDocumentos:
    def __init__(self, configuracao: ConfiguracaoMapperDocumentos):
        self._configuracao = configuracao


    def construir(self) -> dict[str, Any]:
        return self._settings() | self._mappings()


    def _settings(self) -> dict[str, Any]:
        settings = {
            'index': {
                'number_of_shards': self._configuracao.numero_shards,
                'number_of_replicas': self._configuracao.numero_replicas,
                'similarity': {
                    'default': {
                        'type': 'BM25',
                        'b': self._configuracao.b,
                        'k1': self._configuracao.k1
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
                    "fonte_dados_id": {
                        "type": "integer"
                    },
                    "documento_id": {
                        "type": "keyword"
                    },
                    "nome_documento": {
                        "type": "keyword",
                    },
                    "tipo_documento": {
                        "type": "keyword",
                    },
                    "id_trecho": {
                        "type": "integer",
                    },
                    "conteudo": {
                        "type": "text",
                        "analyzer": "pt-BR",
                    },
                    "embeddings": {
                        "type": "dense_vector",
                        "dims": self._configuracao.embeddings_dims,
                        "similarity": "cosine",
                        "index": True,
                    },
                },
            }
        }
