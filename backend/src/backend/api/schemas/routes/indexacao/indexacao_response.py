from typing import Literal

from pydantic import BaseModel



class IndexacaoResponse(BaseModel):
    id_processamento: str
    nome_arquivo: str
    nome_indice: str
    tipo_mapping: TipoMapping
    status: Literal['processing'] = 'processing'


class IndexacaoLoteResponse(IndexacaoResponse):
    quantidade_arquivos: int
