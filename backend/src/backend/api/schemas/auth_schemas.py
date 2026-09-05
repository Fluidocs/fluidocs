from pydantic import BaseModel, EmailStr, Field


class SignInRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=60)
    email: EmailStr = Field(max_length=100)
    senha: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = 'bearer'


class CadastroUsuarioResponse(BaseModel):
    nome: str
    email: EmailStr