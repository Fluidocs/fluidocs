from pydantic import BaseModel, Field
from fastapi import File, UploadFile
from typing import Literal


class IndexacaoBaseRequest(BaseModel):
    fonte_dados_id: int = Field(
        gt=0,
        description='Identificador da fonte de dados do documento.',
    )


class IndexacaoRequest(IndexacaoBaseRequest):
    arquivo: UploadFile = File(
        description='Arquivo PDF, JPEG, PNG ou TXT.'
    )


class IndexacaoLoteRequest(IndexacaoBaseRequest):
    arquivo_zip: UploadFile = File(
        description='Arquivo ZIP contendo documentos suportados.'
    )


class IndexacaoResponse(BaseModel):
    id_processamento: str
    nome_arquivo: str
    fonte_dados_id: int
    documento_id: str
    status: Literal['processing'] = 'processing'


class IndexacaoLoteResponse(BaseModel):
    id_processamento: str
    nome_arquivo: str
    fonte_dados_id: int
    quantidade_arquivos: int
    status: Literal['processing'] = 'processing'
