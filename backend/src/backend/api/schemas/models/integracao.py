from pydantic import BaseModel

class IntegracaoResponse(BaseModel):
    id: int
    nome_integracao: str