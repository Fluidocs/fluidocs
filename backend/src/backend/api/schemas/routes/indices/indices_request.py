# [TODO] Alterar lógica para quando houver outro tipo de mapeamento (por dump/tabela)

from pydantic import BaseModel, Field

from backend.domain.indices.mapping.tipo_mapping import TipoMapping

class ConfiguracaoDocumentosRequest(BaseModel):
    numero_shards: int = Field(default=1, ge=1, le=20)
    numero_replicas: int = Field(default=0, ge=0, le=10)
    b: float = Field(default=0.7, ge=0, le=1)
    k1: float = Field(default=0.6, ge=0, le=3)


class CreateIndiceRequest(BaseModel):
    nome_indice: str = Field(
        examples=['novo_indice', 'indice'],
        min_length=3, 
    )
    tipo_mapping: TipoMapping = TipoMapping.DOCUMENTOS
    configuracao: ConfiguracaoDocumentosRequest = Field(
        default_factory=ConfiguracaoDocumentosRequest
    )
