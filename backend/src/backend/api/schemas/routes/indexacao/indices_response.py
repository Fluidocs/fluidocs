from pydantic import BaseModel

class CreateIndiceResponse(BaseModel):
    nome_indice: str
    tipo_mapping: str
    message: str


class DestroyIndiceResponse(BaseModel):
    nome_indice: str
    message: str