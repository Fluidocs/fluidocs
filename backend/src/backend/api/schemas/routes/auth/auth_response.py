from pydantic import BaseModel

from backend.api.schemas.routes.usuario import UsuarioResponse


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'
    usuario: UsuarioResponse
