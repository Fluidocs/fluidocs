from elasticsearch import (
    AsyncElasticsearch,
    BadRequestError,
    NotFoundError,
)
from fastapi import HTTPException, status

from backend.domain.indices.exceptions import ConfiguracaoInvalidaError
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


    @tratar_indisponibilidade_elasticsearch
    async def remover_documentos_da_fonte(
        self,
        usuario_id: int,
        fonte_dados_id: int,
    ) -> int:
        nome_indice = gerar_nome_indice(usuario_id)

        try:
            await self._cliente.indices.refresh(index=nome_indice)
            resultado = await self._cliente.delete_by_query(
                index=nome_indice,
                query={
                    'term': {
                        'fonte_dados_id': fonte_dados_id
                    }
                },
                refresh=True
            )
        except NotFoundError:
            return 0

        falhas = resultado.get('failures', [])
        if falhas:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=(
                    'Falhas ao processar a exclusão de trechos '
                    f'ao deletar fonte de dados (ID: {fonte_dados_id}).'
                )
            )

        return resultado.get('deleted', 0)
