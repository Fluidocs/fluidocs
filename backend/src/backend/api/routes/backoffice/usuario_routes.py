from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, Path, status

from backend.api.dependencies.auth import obter_usuario_autenticado
from backend.api.dependencies.user import obter_servico_usuario
from backend.api.helpers.user import (
    montar_usuario_response,
    validar_acesso_ao_proprio_usuario,
)
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import (
    AtualizarUsuarioRequest,
    UsuarioResponse,
)
from backend.api.schemas.routes.base_response import BaseResponse, MetaSchema
from backend.api.services.usuario import ServicoUsuario


usuario_router = APIRouter(tags=['usuario'])


@usuario_router.get(
    '/me',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Retorna o usuario autenticado a partir do token JWT.',
)
async def obter_usuario_atual(
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario_autenticado),
    )

@usuario_router.get(
    '/{usuario_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Retorna um usuario pelo identificador.',
)
async def obter_usuario(
    usuario_id: Annotated[int, Path(gt=0)],
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    validar_acesso_ao_proprio_usuario(usuario_id, usuario_autenticado)
    usuario = await servico.obter(usuario_id)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )


@usuario_router.patch(
    '/{usuario_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Atualiza um usuario pelo identificador.',
)
async def atualizar_usuario(
    usuario_id: Annotated[int, Path(gt=0)],
    dados: AtualizarUsuarioRequest,
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    validar_acesso_ao_proprio_usuario(usuario_id, usuario_autenticado)
    usuario = await servico.atualizar(usuario_id, dados)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )


@usuario_router.delete(
    '/{usuario_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Remove um usuario pelo identificador.',
)
async def deletar_usuario(
    usuario_id: Annotated[int, Path(gt=0)],
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    validar_acesso_ao_proprio_usuario(usuario_id, usuario_autenticado)
    usuario = await servico.obter(usuario_id)
    await servico.deletar(usuario_id)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )