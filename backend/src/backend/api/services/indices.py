from typing import Any
from elasticsearch import AsyncElasticsearch, NotFoundError, BadRequestError
from fastapi import HTTPException

from backend.domain.indices.mapping.mapping_factory import MappingFactory
from backend.api.schemas.routes.indexacao.indices_request import CreateIndiceRequest


class ServicoIndices:
    def __init__(self, cliente: AsyncElasticsearch):
        self._cliente = cliente


    async def listar_indices(self):
        indices = await self._cliente.indices.get_alias(index='*')

        return sorted(indices.keys()) 


    async def criar_indice(
        self, 
        params: CreateIndiceRequest
    ) -> dict[str, Any] | None:
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

        # [TODO] Service não deveria conhecer a resposta HTTP
        return {
            'nome_indice': params.nome_indice,
            'tipo_mapping': params.tipo_mapping,
            'message': 'Índice criado com sucesso!' 
        }


    # [TODO] Service não deveria conhecer o erro da camada HTTP
    async def deletar_indice(
        self, 
        nome_indice: str
    ) -> bool:
        try:
            await self._cliente.indices.delete(
                index=nome_indice
            )

            return True
        except NotFoundError:
            raise HTTPException(
                status_code=404,
                detail={
                    'message': 'Índice não encontrado.',
                    'nome_indice': nome_indice
                }
            )
        except BadRequestError:
            raise HTTPException(
                status_code=400,
                detail={
                    'message': 'A configuração do índice é inválida.'
                }
            )
