from fastapi import Request, Depends
from typing import Annotated

from backend.config.configuracoes import config
from backend.api.services.indice import ServicoIndice
from backend.domain.indices.mapping import MapperDocumentos, ConfiguracaoMapperDocumentos

def obter_configuracao_mapper() -> ConfiguracaoMapperDocumentos:
    return ConfiguracaoMapperDocumentos(
        numero_shards=config.numero_shards,
        numero_replicas=config.numero_replicas,
        embeddings_dims=config.embeddings_dims,
        b=0.7,
        k1=0.6
    )


def obter_mapper(
    config: Annotated[
        ConfiguracaoMapperDocumentos,
        Depends(obter_configuracao_mapper)
    ]
) -> MapperDocumentos:
    return MapperDocumentos(
        configuracao=config
    )


def obter_servico_indices(
    requisicao: Request,
    mapper: Annotated[
        MapperDocumentos, 
        Depends(obter_mapper)
    ]
) -> ServicoIndice:
    return ServicoIndice(
        cliente=requisicao.app.state.elasticsearch,
        mapper=mapper
    )
