from pydantic import BaseModel

class CreateIndiceResponse(BaseModel):
    nome_indice: str
    tipo_mapping: str


class DestroyIndiceResponse(BaseModel):
    nome_indice: str
