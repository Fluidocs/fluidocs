from pydantic import BaseModel, Field
from fastapi import File, UploadFile

from backend.domain.indices.mapping.tipo_mapping import TipoMapping

class IndexacaoBaseRequest(BaseModel):
    nome_indice: str = Field(
        default='documentos',
        min_length=3, 
        description='Nome do índice de destino.'
    ),
    tipo_mapping: TipoMapping = Field(
        default=TipoMapping.DOCUMENTOS,
        description='Tipo do mapping do índice de destino.'
    )


class IndexacaoRequest(IndexacaoBaseRequest):
    arquivo: UploadFile = File(
        description='Arquivo PDF, JPEG, PNG ou TXT.'
    )


class IndexacaoLoteRequest(IndexacaoBaseRequest):
    arquivo_zip: UploadFile = File(
        description='Arquivo ZIP contendo documentos suportados.'
    )
