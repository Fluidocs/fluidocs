from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from backend.api.models.usuario import Usuario
from backend.config.configuracoes import config
from backend.core.seguranca import (
    ALGORITMO_TOKEN,
    codificar_jwt,
    decodificar_jwt,
    validar_senha,
)


class ServicoAuth:
    async def autenticar(
        self,
        *,
        email: str,
        senha: str,
    ) -> Usuario:
        usuario = await Usuario.get_or_none(email=self._normalizar_email(email))
        if not usuario:
            raise self._credenciais_invalidas()

        if not validar_senha(senha, usuario.senha):
            raise self._credenciais_invalidas()

        return usuario

    def gerar_token_acesso(self, usuario: Usuario) -> str:
        agora = datetime.now(UTC)
        expira_em = agora + timedelta(
            minutes=config.jwt_access_token_expire_minutes,
        )
        payload = {
            'sub': str(usuario.id),
            'email': usuario.email,
            'iss': config.jwt_issuer,
            'iat': int(agora.timestamp()),
            'exp': int(expira_em.timestamp()),
        }

        return codificar_jwt(payload, config.jwt_secret)

    async def obter_usuario_por_token(self, token: str) -> Usuario:
        payload = self._decodificar_payload_token(token)
        usuario_id = payload.get('sub')
        if not usuario_id:
            raise self._token_invalido()

        usuario = await Usuario.get_or_none(id=usuario_id)
        if not usuario:
            raise self._token_invalido()

        return usuario

    def _decodificar_payload_token(self, token: str) -> dict:
        try:
            header, payload = decodificar_jwt(token, config.jwt_secret)
        except (ValueError, TypeError):
            raise self._token_invalido()

        if header.get('alg') != ALGORITMO_TOKEN:
            raise self._token_invalido()

        if payload.get('iss') != config.jwt_issuer:
            raise self._token_invalido()

        if int(payload.get('exp', 0)) < int(datetime.now(UTC).timestamp()):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail='Token expirado.',
                headers={'WWW-Authenticate': 'Bearer'},
            )

        return payload

    @staticmethod
    def _normalizar_email(email: str) -> str:
        return email.strip().lower()

    @staticmethod
    def _credenciais_invalidas() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='E-mail ou senha invalidos.',
            headers={'WWW-Authenticate': 'Bearer'},
        )

    @staticmethod
    def _token_invalido() -> HTTPException:
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail='Token de autenticacao invalido.',
            headers={'WWW-Authenticate': 'Bearer'},
        )
