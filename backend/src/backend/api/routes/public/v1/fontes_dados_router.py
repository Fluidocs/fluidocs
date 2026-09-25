from fastapi import APIRouter, HTTPException, Depends, status
from time import perf_counter

from backend.api.schemas.base_response import BaseResponse
from backend.api.schemas.backoffice.fontes_dados_schemas import (
    FonteDadosCreateRequest, 
    FonteDadosUpdateRequest,
    FonteDadosResponse
)
from backend.api.models.usuario import Usuario
from backend.api.services.fontes_dados import ServicoFontesDeDados
from backend.api.dependencies.fontes_dados import obter_servico_fontes_de_dados
from backend.api.dependencies.chave_api import obter_usuario_por_chave_api


fontes_router = APIRouter(prefix='/fontes-dados')


@fontes_router.get(
    '/',
    status_code=status.HTTP_200_OK
)
async def listar_fontes(
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_por_chave_api)
) -> BaseResponse[list[FonteDadosResponse]]:
    inicio = perf_counter()
    fontes_de_dados = await servico_fontes.listar_fontes(usuario_autenticado.id)
   
    return BaseResponse(
        meta={'tempo_execucao': inicio - perf_counter()},
        dados=[
            FonteDadosResponse.model_validate(fonte) for fonte in fontes_de_dados
        ]   
    )


@fontes_router.get(
    '/{id}',
    status_code=status.HTTP_200_OK
)
async def obter_fonte(
    id: int,
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados),
    usuario_autenticado: Usuario = Depends(obter_usuario_por_chave_api)
) -> BaseResponse[FonteDadosResponse]:
    inicio = perf_counter()
    fonte_dados = await servico_fontes.obter(id, usuario_autenticado.id)

    return BaseResponse(
        meta={'tempo_execucao': perf_counter() - inicio},
        dados=FonteDadosResponse.model_validate(fonte_dados)
    )
