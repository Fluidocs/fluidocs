from time import perf_counter
from typing import Annotated

from fastapi import APIRouter, Depends, Path, status

from backend.api.dependencies.user import obter_servico_usuario
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.usuario_schemas import (
    AtualizarUsuarioRequest,
    CriarUsuarioRequest,
    UsuarioResponse,
)
from backend.api.schemas.routes.base_response import BaseResponse, MetaSchema
from backend.api.services.usuario import ServicoUsuario


usuario_router = APIRouter(tags=['usuario'])


@usuario_router.post(
    '/',
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[UsuarioResponse],
    description='Cria um usuario.',
)
async def criar_usuario(
    dados: CriarUsuarioRequest,
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    usuario = await servico.criar(dados)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )


@usuario_router.get(
    '/{usuario_id}',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Retorna um usuario pelo identificador.',
)
async def obter_usuario(
    usuario_id: Annotated[int, Path(gt=0)],
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
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
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
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
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    usuario = await servico.obter(usuario_id)
    await servico.deletar(usuario_id)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=montar_usuario_response(usuario),
    )


def montar_usuario_response(usuario: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        foto_perfil=usuario.foto_perfil,
        data_criacao=usuario.data_criacao,
        data_atualizacao=usuario.data_atualizacao,
    )
