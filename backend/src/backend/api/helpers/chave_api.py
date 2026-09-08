from backend.api.models.chave_api import ChaveAPI
from backend.api.schemas.backoffice.chave_api_schemas import ChaveAPIResponse


def montar_chave_api_response(chave_api: ChaveAPI) -> ChaveAPIResponse:
    return ChaveAPIResponse(
        id=chave_api.id,
        nome=chave_api.nome,
        descricao=chave_api.descricao,
    )