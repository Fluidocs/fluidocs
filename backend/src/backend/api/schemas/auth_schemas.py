from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class CadastroUsuarioResponse(BaseModel):
    nome: str
    email: EmailStr