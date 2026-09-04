from datetime import UTC, datetime, timedelta
from typing import Any

import jwt


class TokenProvider:
    def __init__(
        self,
        *,
        secret: str,
        algorithm: str,
        tempo_expiracao_minutos: int,
    ) -> None:
        self.secret = secret
        self.algorithm = algorithm
        self.tempo_expiracao_minutos = tempo_expiracao_minutos

    def gerar_token_acesso(
        self,
        *,
        usuario_id: int,
        email: str,
    ) -> str:
        agora = datetime.now(UTC)
        payload = {
            'sub': str(usuario_id),
            'email': email,
            'type': 'access',
            'iat': agora,
            'exp': agora + timedelta(minutes=self.tempo_expiracao_minutos),
        }

        return jwt.encode(
            payload,
            self.secret,
            algorithm=self.algorithm,
        )

    def decodificar_token(self, token: str) -> dict[str, Any]:
        return jwt.decode(
            token,
            self.secret,
            algorithms=[self.algorithm],
        )
