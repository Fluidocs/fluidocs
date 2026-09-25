from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError

from backend.api.models.usuario import Usuario
from backend.api.services.auth import ServicoAuth
from backend.api.core.auth.gerador_hash import GeradorHash
from backend.api.core.auth.gerador_tokens import TokenProvider
from backend.config.configuracoes import config

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl='/auth/login',
    auto_error=False,
)

def obter_gerador_hash() -> GeradorHash:
    return GeradorHash()


def obter_gerador_token() -> TokenProvider:
    return TokenProvider(
        secret=config.secret_key,
        algorithm=config.jwt_algorithm,
        tempo_expiracao_minutos=config.jwt_access_token_expire_minutes,
    )


def obter_servico_auth(
    gerador_hash: GeradorHash = Depends(obter_gerador_hash),
    gerador_token: TokenProvider = Depends(obter_gerador_token),
) -> ServicoAuth:
    return ServicoAuth(
        gerador_hash=gerador_hash,
        gerador_token=gerador_token,
    )


async def obter_usuario_autenticado(
    token: str | None = Depends(oauth2_scheme),
    gerador_token: TokenProvider = Depends(obter_gerador_token),
) -> Usuario:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Credenciais de autenticacao nao informadas.',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    try:
        payload = gerador_token.decodificar_token(token)
        if payload.get('type') != 'access':
            raise _token_invalido()

        usuario_id = payload.get('sub')
        if not usuario_id:
            raise _token_invalido()

        usuario_id = int(usuario_id)
    except (InvalidTokenError, ValueError):
        raise _token_invalido()

    usuario = await Usuario.get_or_none(id=usuario_id)
    if not usuario:
        raise _token_invalido()

    return usuario


def _token_invalido() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Token de autenticacao invalido.',
        headers={'WWW-Authenticate': 'Bearer'},
    )