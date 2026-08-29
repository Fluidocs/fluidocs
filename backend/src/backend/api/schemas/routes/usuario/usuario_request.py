from pydantic import BaseModel, EmailStr, Field


class CriarUsuarioRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=60)
    email: EmailStr = Field(max_length=100)
    senha: str = Field(min_length=8, max_length=128)
    foto_perfil: str | None = Field(default=None, max_length=255)


class AtualizarUsuarioRequest(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=60)
    email: EmailStr | None = Field(default=None, max_length=100)
    senha: str | None = Field(default=None, min_length=8, max_length=128)
    foto_perfil: str | None = Field(default=None, max_length=255)
