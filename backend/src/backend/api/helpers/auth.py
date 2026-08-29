from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from backend.api.models.usuario import Usuario
from backend.api.services.auth import ServicoAuth


bearer_scheme = HTTPBearer(auto_error=False)


def obter_servico_auth() -> ServicoAuth:
    return ServicoAuth()


async def obter_usuario_autenticado(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    servico: ServicoAuth = Depends(obter_servico_auth),
) -> Usuario:
    if not credenciais:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Credenciais de autenticacao nao informadas.',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    return await servico.obter_usuario_por_token(credenciais.credentials)