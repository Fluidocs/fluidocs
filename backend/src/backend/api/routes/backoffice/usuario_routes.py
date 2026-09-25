from time import perf_counter

from fastapi import APIRouter, Depends, status

from backend.api.dependencies.auth import obter_usuario_autenticado
from backend.api.dependencies.usuario import obter_servico_usuario
from backend.api.helpers.usuario import montar_usuario_response
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import (
    AtualizarUsuarioRequest,
    UsuarioResponse,
)
from backend.api.schemas.base_response import BaseResponse, MetaSchema
from backend.api.services.usuario import ServicoUsuario

usuario_router = APIRouter(tags=['Usuário'])

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


@usuario_router.patch(
    '/me',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Atualiza os dados do usuario autenticado.',
)
async def atualizar_usuario(
    dados: AtualizarUsuarioRequest,
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    usuario = await servico.atualizar(usuario_autenticado, dados)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )


@usuario_router.delete(
    '/me',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Remove a conta do usuario autenticado.',
)
async def deletar_usuario(
    usuario_autenticado: Usuario = Depends(obter_usuario_autenticado),
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    usuario = await servico.deletar(usuario_autenticado)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )