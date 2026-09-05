from time import perf_counter

from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from backend.api.dependencies.auth import obter_servico_auth
from backend.api.dependencies.user import obter_servico_usuario
from backend.api.schemas.auth_schemas import (
    CadastroUsuarioResponse,
    TokenResponse,
)
from backend.api.schemas.backoffice.usuario_schemas import (
    CriarUsuarioRequest,
)
from backend.api.schemas.routes.base_response import BaseResponse, MetaSchema
from backend.api.services.auth import ServicoAuth
from backend.api.services.usuario import ServicoUsuario


auth_router = APIRouter(tags=['auth'])


@auth_router.post(
    '/cadastrar',
    status_code=status.HTTP_201_CREATED,
    response_model=BaseResponse[CadastroUsuarioResponse],
    description='Cadastra um usuario.',
)
async def cadastrar_usuario(
    dados: CriarUsuarioRequest,
    servico: ServicoUsuario = Depends(obter_servico_usuario),
) -> BaseResponse[CadastroUsuarioResponse]:
    inicio = perf_counter()
    usuario = await servico.criar(dados)

    return BaseResponse(
        meta=MetaSchema(tempo_execucao=perf_counter() - inicio),
        dados=CadastroUsuarioResponse(
            nome=usuario.nome,
            email=usuario.email,
        ),
    )


@auth_router.post(
    '/login',
    status_code=status.HTTP_200_OK,
    response_model=TokenResponse,
    description='Autentica um usuario e retorna um token de acesso JWT.',
)
async def login(
    dados: OAuth2PasswordRequestForm = Depends(),
    servico: ServicoAuth = Depends(obter_servico_auth),
) -> TokenResponse:
    return await servico.autenticar(
        email=dados.username,
        senha=dados.password,
    )