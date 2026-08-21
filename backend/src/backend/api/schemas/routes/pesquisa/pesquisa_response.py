from pydantic import BaseModel


class TrechoPesquisaResponse(BaseModel):
    id_trecho: int | None
    conteudo: str | None
    pontuacao: float


class DocumentoPesquisaResponse(BaseModel):
    nome_documento: str
    pontuacao: float
    trechos: list[TrechoPesquisaResponse]