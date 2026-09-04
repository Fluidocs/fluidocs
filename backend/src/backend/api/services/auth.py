from fastapi import HTTPException, status

from backend.api.helpers.auth import normalizar_email
from backend.api.models.usuario import Usuario
from backend.api.core.auth.gerador_hash import GeradorHash
from backend.api.core.auth.gerador_tokens import TokenProvider
from backend.api.schemas.auth_schemas import TokenResponse


class ServicoAuth:
    def __init__(
        self,
        *,
        gerador_hash: GeradorHash,
        gerador_token: TokenProvider,
    ) -> None:
        self.gerador_hash = gerador_hash
        self.gerador_token = gerador_token

    async def autenticar(
        self,
        *,
        email: str,
        senha: str,
    ) -> TokenResponse:
        usuario = await Usuario.get_or_none(email=normalizar_email(email))
        if not usuario:
            raise self._credenciais_invalidas()

        if not self.gerador_hash.validar_senha(senha, usuario.senha):
            raise self._credenciais_invalidas()

        return TokenResponse(
            access_token=self.gerador_token.gerar_token_acesso(
                usuario_id=usuario.id,
                email=usuario.email,
            ),
        )

    @staticmethod
    def _credenciais_invalidas() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='E-mail ou senha invalidos.',
            headers={'WWW-Authenticate': 'Bearer'},
        )
