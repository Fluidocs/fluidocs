from fastapi import APIRouter, Depends

from backend.api.schemas.routes.pesquisa.pesquisa_request import PesquisaRequest
from backend.api.schemas.routes.pesquisa.pesquisa_response import DocumentoPesquisaResponse
from backend.api.schemas.routes.base_response import BaseResponse
from backend.api.helpers.pesquisa import obter_servico_pesquisa
from backend.api.services.pesquisa import ServicoPesquisa

pesquisa_router = APIRouter(
    tags=['pesquisa']
)


# [TODO] Adicionar filtros, limitação por usuário e etc...
@pesquisa_router.post(
    path='/pesquisar',
    status_code=200,
    description='Realiza a pesquisa em um índice a partir dos tipos "lexical", "vetorial" e "híbrida".'
)
async def pesquisar(
    dados: PesquisaRequest,
    servico_pesquisa: ServicoPesquisa = Depends(obter_servico_pesquisa)
) -> BaseResponse[list[DocumentoPesquisaResponse]]:
    response = await servico_pesquisa.pesquisar_async(dados)

    return {
       'dados': response.documentos,
       'paginacao': response.paginacao
    }
