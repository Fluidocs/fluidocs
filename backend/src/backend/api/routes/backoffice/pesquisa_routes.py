from fastapi import APIRouter, Depends
from time import perf_counter

from backend.api.schemas.base_response import BaseResponse
from backend.api.schemas.backoffice.pesquisa_schemas import PesquisaRequest, DocumentoPesquisaResponse
from backend.api.dependencies.chave_api import obter_usuario_por_chave_api
from backend.api.dependencies.pesquisa import obter_servico_pesquisa
from backend.api.models.usuario import Usuario
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
    usuario: Usuario = Depends(obter_usuario_por_chave_api),
    servico_pesquisa: ServicoPesquisa = Depends(obter_servico_pesquisa)
) -> BaseResponse[list[DocumentoPesquisaResponse]]:
    inicio = perf_counter()
    response = await servico_pesquisa.pesquisar_async(usuario.id, dados)

    return {
        'meta': { 'tempo_execucao': perf_counter() - inicio },
        'dados': response.documentos,
        'paginacao': response.paginacao
    }
