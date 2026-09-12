import hmac
from hashlib import sha256
from secrets import token_urlsafe


class GeradorChaveAPI:
    def __init__(
        self,
        secret: str,
    ) -> None:
        self.secret = secret

    def gerar_token(self) -> str:
        return token_urlsafe(32)

    def gerar_hash_token(self, token: str) -> str:
        return hmac.new(
            self.secret.encode('utf-8'),
            token.encode('utf-8'),
            sha256,
        ).hexdigest()
