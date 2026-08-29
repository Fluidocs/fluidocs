from fastapi import APIRouter, Depends, HTTPException, Path
from elasticsearch import BadRequestError
from typing import Annotated

from backend.api.helpers.auth import obter_usuario_autenticado
from backend.api.helpers.indices import obter_servico_indices
from backend.api.models.usuario import Usuario
from backend.api.services.indices import ServicoIndices
from backend.api.schemas.routes.base_response import BaseResponse
from backend.api.schemas.routes.indices.indices_request import CreateIndiceRequest
from backend.api.schemas.routes.indices.indices_response import CreateIndiceResponse, DestroyIndiceResponse

indices_router = APIRouter(tags=['indices'])

# [TODO] Adicionar listagem por model (armazenar configurações)
@indices_router.get(
    '/',
    status_code=200,
    description='Listar todos os índices existentes no Elasticsearch'
)
async def listar_indices(
    usuario: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoIndices = Depends(obter_servico_indices)
) -> BaseResponse:
    response = await servico.listar_indices()

    return {
        'dados': response
    }


# [TODO] Adicionar model e bloqueio de criação por limite no usuário (3 indices)
@indices_router.post(
    '/',
    status_code=201,
    description='Criar um novo índice para pesquisa'
)
async def criar_indice(
    data: CreateIndiceRequest,
    usuario: Usuario = Depends(obter_usuario_autenticado),
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


# [TODO] Adicionar model pra exclusão
@indices_router.delete(
    '/{nome_indice}',
    status_code=200,
    description='Deleta um determinado índice do Elasticsearch (remove todo o contéudo indexado)'
)
async def deletar_indice(
    nome_indice: Annotated[str, Path(min_length=3)],
    usuario: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoIndices = Depends(obter_servico_indices)
) -> BaseResponse[DestroyIndiceResponse]:
    await servico.deletar_indice(nome_indice)

    return {
        'dados': {
            'nome_indice': nome_indice,
        }
    }
    
