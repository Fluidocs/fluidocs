from fastapi import APIRouter, Depends, status
from time import perf_counter

from backend.api.helpers.auth import (
    obter_servico_auth,
    obter_usuario_autenticado,
)
from backend.api.models.usuario import Usuario
from backend.api.schemas.routes.auth import (
    SignInRequest,
    TokenResponse,
)
from backend.api.schemas.routes.base_response import BaseResponse, MetaSchema
from backend.api.schemas.routes.usuario import UsuarioResponse
from backend.api.services.auth import ServicoAuth


auth_router = APIRouter(tags=['auth'])


@auth_router.post(
    '/signin',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[TokenResponse],
    description='Autentica um usuario e retorna um token de acesso JWT.',
)
async def sign_in(
    dados: SignInRequest,
    servico: ServicoAuth = Depends(obter_servico_auth),
) -> BaseResponse[TokenResponse]:
    inicio = perf_counter()
    usuario = await servico.autenticar(
        email=dados.email,
        senha=dados.senha,
    )

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=_montar_token_response(servico, usuario),
    )


@auth_router.get(
    '/me',
    status_code=status.HTTP_200_OK,
    response_model=BaseResponse[UsuarioResponse],
    description='Retorna o usuario autenticado a partir do token JWT.',
)
async def obter_usuario_atual(
    usuario: Usuario = Depends(obter_usuario_autenticado),
) -> BaseResponse[UsuarioResponse]:
    inicio = perf_counter()
    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=_montar_usuario_response(usuario),
    )


def _montar_token_response(
    servico: ServicoAuth,
    usuario: Usuario,
) -> TokenResponse:
    return TokenResponse(
        access_token=servico.gerar_token_acesso(usuario),
        usuario=_montar_usuario_response(usuario),
    )


def _montar_usuario_response(usuario: Usuario) -> UsuarioResponse:
    return UsuarioResponse(
        id=usuario.id,
        nome=usuario.nome,
        email=usuario.email,
        foto_perfil=usuario.foto_perfil,
        data_criacao=usuario.data_criacao,
        data_atualizacao=usuario.data_atualizacao,
    )
