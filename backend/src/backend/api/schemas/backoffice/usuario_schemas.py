from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: EmailStr
    foto_perfil: str | None
    data_criacao: datetime
    data_atualizacao: datetime
    comportamento_ia: str | None = None


class CriarUsuarioRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=60)
    email: EmailStr = Field(max_length=100)
    senha: str = Field(min_length=8, max_length=128)


class AtualizarUsuarioRequest(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=60)
    email: EmailStr | None = Field(default=None, max_length=100)
    senha: str | None = Field(default=None, min_length=8, max_length=128)
    foto_perfil: str | None = Field(default=None, max_length=255)
    comportamento_ia: str | None = None
