from typing import List
from elasticsearch import (
    AsyncElasticsearch, 
    NotFoundError, 
    BadRequestError
)

from backend.api.schemas.routes.indices.indices_request import CreateIndiceRequest
from backend.domain.indices.mapping.mapping_factory import MappingFactory
from backend.domain.indices.exceptions import *
from backend.api.helpers.exceptions.elasticsearch import (
    tratar_indisponibilidade_elasticsearch,
)

class ServicoIndices:
    def __init__(self, cliente: AsyncElasticsearch):
        self._cliente = cliente


    @tratar_indisponibilidade_elasticsearch
    async def listar_indices(self) -> List[str]:
        indices = await self._cliente.indices.get_alias(index='*')

        return sorted(indices.keys()) 


    @tratar_indisponibilidade_elasticsearch
    async def criar_indice(
        self, 
        params: CreateIndiceRequest
    ) -> None:
        exists = await self._cliente.indices.exists(index=params.nome_indice)
        if exists: 
            raise IndiceExistenteError(params.nome_indice)
        
        strategy = MappingFactory.get(
            tipo=params.tipo_mapping,
            numero_shards=params.configuracao.numero_shards,
            numero_replicas=params.configuracao.numero_replicas,
            b=params.configuracao.b,
            k1=params.configuracao.k1
        )
        body = strategy.construir()

        await self._cliente.indices.create(
            index=params.nome_indice,
            body=body
        )


    @tratar_indisponibilidade_elasticsearch
    async def deletar_indice(
        self, 
        nome_indice: str
    ) -> None:
        try:
            await self._cliente.indices.delete(
                index=nome_indice
            )
        except NotFoundError as error:
            raise IndiceNaoEncontradoError(
                nome_indice
            ) from error
        except BadRequestError as error:
            raise ConfiguracaoInvalidaError(
                nome_indice
            ) from error
