from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.domain.pesquisa.exceptions import PesquisaInvalidaError

async def pesquisa_invalida_handler(
    request: Request,
    erro: PesquisaInvalidaError
) -> JSONResponse:
    detail = {
        'message': str(erro),
        'nome_indice': erro.nome_indice
    }

    if erro.detalhe:
        detail['description'] = erro.detalhe
    
    return JSONResponse(
        status_code=400,
        content={
            'detail': detail
        }
    )

def registrar_pesquisa_handlers(app: FastAPI):
    app.add_exception_handler(
        PesquisaInvalidaError,
        pesquisa_invalida_handler
    )