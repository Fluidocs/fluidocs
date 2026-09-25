from time import perf_counter

from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.dependencies.auth import obter_usuario_autenticado
from backend.api.dependencies.chave_api import obter_servico_chave_api
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.chave_api_schemas import (
    AtualizarChaveAPIRequest,
    ChaveAPIResponse,
    CriarChaveAPIRequest,
    CriarChaveAPIResponse,
)
from backend.api.schemas.base_response import BaseResponse, MetaSchema
from backend.api.services.chave_api import ServicoChaveAPI

chave_api_router = APIRouter(tags=['Chaves de API'])


@chave_api_router.post(
    '',
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[CriarChaveAPIResponse],
    description='Cria uma chave de API para o usuario autenticado.',
)
async def criar_chave_api(
    dados: CriarChaveAPIRequest,
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoChaveAPI = Depends(obter_servico_chave_api),
) -> BaseResponse[CriarChaveAPIResponse]:
    inicio = perf_counter()
    chave_api, token = await servico.criar(usuario_autenticado, dados)
    chave_api.token = token

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=CriarChaveAPIResponse.model_validate(chave_api),
    )


@chave_api_router.get(
    '',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[list[ChaveAPIResponse]],
    description='Lista as chaves de API do usuario autenticado.',
)
async def listar_chaves_api(
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoChaveAPI = Depends(obter_servico_chave_api),
) -> BaseResponse[list[ChaveAPIResponse]]:
    inicio = perf_counter()
    chaves_api = await servico.listar(usuario_autenticado)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=[ChaveAPIResponse.model_validate(chave_api) for chave_api in chaves_api],
    )


@chave_api_router.get(
    '/{chave_api_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[ChaveAPIResponse],
    description='Consulta uma chave de API do usuario autenticado.',
)
async def obter_chave_api(
    chave_api_id: int,
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoChaveAPI = Depends(obter_servico_chave_api),
) -> BaseResponse[ChaveAPIResponse]:
    inicio = perf_counter()
    chave_api = await servico.obter(usuario_autenticado, chave_api_id)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=ChaveAPIResponse.model_validate(chave_api),
    )


@chave_api_router.patch(
    '/{chave_api_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[ChaveAPIResponse],
    description='Atualiza os dados permitidos de uma chave de API do usuario autenticado.',
)
async def atualizar_chave_api(
    chave_api_id: int,
    dados: AtualizarChaveAPIRequest,
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoChaveAPI = Depends(obter_servico_chave_api),
) -> BaseResponse[ChaveAPIResponse]:
    inicio = perf_counter()
    campos_update = dados.model_dump(exclude_unset=True)
    if not campos_update:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail='Dados para a atualizacao nao podem estar em branco.',
        )

    chave_api = await servico.atualizar(
        usuario_autenticado,
        chave_api_id,
        campos_update,
    )

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=ChaveAPIResponse.model_validate(chave_api),
    )


@chave_api_router.delete(
    '/{chave_api_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[ChaveAPIResponse],
    description='Remove uma chave de API do usuario autenticado.',
)
async def deletar_chave_api(
    chave_api_id: int,
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoChaveAPI = Depends(obter_servico_chave_api),
) -> BaseResponse[ChaveAPIResponse]:
    inicio = perf_counter()
    chave_api = await servico.deletar(usuario_autenticado, chave_api_id)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=ChaveAPIResponse.model_validate(chave_api),
    )