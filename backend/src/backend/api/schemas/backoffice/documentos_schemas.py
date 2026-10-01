from pydantic import BaseModel


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
