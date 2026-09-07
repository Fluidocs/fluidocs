from typing import List
from elasticsearch import (
    AsyncElasticsearch, 
    NotFoundError, 
    BadRequestError
)

from backend.domain.indices.exceptions import *
from backend.domain.indices.mapping.mapper import MapperDocumentos
from backend.domain.indices.nome_indice import gerar_nome_indice
from backend.api.helpers.exceptions.elasticsearch import (
    tratar_indisponibilidade_elasticsearch,
)

class ServicoIndice:
    def __init__(
        self, 
        cliente: AsyncElasticsearch,
        mapper: MapperDocumentos
    ):
        self._cliente = cliente
        self._mapper = mapper


    @tratar_indisponibilidade_elasticsearch
    async def garantir_indice(self, usuario_id: int) -> None:
        nome_indice = gerar_nome_indice(usuario_id)

        if await self._cliente.indices.exists(index=nome_indice):
            return  

        try:
            await self._cliente.indices.create(
                index=nome_indice,
                body=self._mapper.construir()
            )
        except BadRequestError as erro: 
            raise ConfiguracaoInvalidaError(
                nome_indice
            ) from erro


    @tratar_indisponibilidade_elasticsearch
    async def remover_indice(self, usuario_id: int) -> None:
        nome_indice = gerar_nome_indice(usuario_id)

        try:
            await self._cliente.indices.delete(
                index=nome_indice
            )
        except NotFoundError:
            return 
