from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class ConfiguracaoMapperDocumentos:
    numero_shards: int
    numero_replicas: int
    embeddings_dims: int
    b: float = 0.7
    k1: float = 0.6
