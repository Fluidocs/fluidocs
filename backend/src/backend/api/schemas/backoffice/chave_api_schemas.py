from pydantic import BaseModel, Field


class ChaveAPIResponse(BaseModel):
    id: int
    nome: str
    descricao: str | None


class CriarChaveAPIRequest(BaseModel):
    nome: str = Field(min_length=1, max_length=60)
    descricao: str | None = Field(default=None, max_length=255)


class CriarChaveAPIResponse(ChaveAPIResponse):
    token: str


class AtualizarChaveAPIRequest(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=60)
    descricao: str | None = Field(default=None, max_length=255)