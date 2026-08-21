from fastapi import APIRouter, Depends, HTTPException, Path
from elasticsearch import BadRequestError
from typing import Annotated

from backend.api.helpers.indices import obter_servico_indices
from backend.api.services.indices import ServicoIndices
from backend.api.schemas.routes.base_response import BaseResponse
from backend.api.schemas.routes.indexacao.indices_request import CreateIndiceRequest
from backend.api.schemas.routes.indexacao.indices_response import CreateIndiceResponse, DestroyIndiceResponse

indices_router = APIRouter(tags=['indices'])

@indices_router.get(
    '/',
    status_code=200,
    description='Listar todos os índices existentes no Elasticsearch'
)
async def listar_indices(
    servico: ServicoIndices = Depends(obter_servico_indices)
) -> BaseResponse:
    response = await servico.listar_indices()

    return {
        'dados': response
    }


@indices_router.post(
    '/',
    status_code=201,
    description='Criar um novo índice para pesquisa'
)
async def criar_indice(
    data: CreateIndiceRequest,
    servico: ServicoIndices = Depends(obter_servico_indices)
) -> BaseResponse[CreateIndiceResponse]:
    await servico.criar_indice(data)

    return {
        'meta': { 'status_code': 201 },
        'dados': {
            'nome_indice': data.nome_indice,
            'tipo_mapping': data.tipo_mapping
        }
    }


@indices_router.delete(
    '/{nome_indice}',
    status_code=200,
    description='Deleta um determinado índice do Elasticsearch (remove todo o contéudo indexado)'
)
async def deletar_indice(
    nome_indice: Annotated[str, Path(min_length=3)],
    servico: ServicoIndices = Depends(obter_servico_indices)
) -> BaseResponse[DestroyIndiceResponse]:
    await servico.deletar_indice(nome_indice)

    return {
        'dados': {
            'nome_indice': nome_indice,
        }
    }
    