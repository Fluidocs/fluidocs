from typing import Literal

from pydantic import BaseModel, Field


class DocumentoResumoResponse(BaseModel):
    uuid: str
    tipo_arquivo: str | None
    nome_documento: str


class DocumentosFonteResponse(BaseModel):
    documentos: list[DocumentoResumoResponse]


class TrechoDocumentoResponse(BaseModel):
    id_trecho: int
    conteudo: str


class DocumentoDetalheResponse(BaseModel):
    uuid: str
    fonte_dados_id: int
    nome_documento: str
    tipo_arquivo: str | None
    trechos: list[TrechoDocumentoResponse]


class DocumentoDesindexadoResponse(BaseModel):
    id: str
    tipo_documento: str | None
    status: Literal['excluído'] = 'excluído'
    quantidade_trechos: int = Field(ge=0)
