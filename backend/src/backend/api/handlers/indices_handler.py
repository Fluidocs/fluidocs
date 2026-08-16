from fastapi import Request, FastAPI
from fastapi.responses import JSONResponse

from backend.domain.indices.exceptions import (
    IndiceExistenteError,
    IndiceNaoEncontradoError,
    ConfiguracaoInvalidaError
)


async def indice_existente_handler(
    request: Request,
    erro: IndiceExistenteError
) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            'detail': {
                'message': str(erro),
                'nome_indice': erro.nome_indice
            }
        }
    )


async def indice_nao_encontrado_handler(
    request: Request,
    erro: IndiceNaoEncontradoError
) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            'detail': {
                'message': str(erro),
                'nome_indice': erro.nome_indice
            }
        }
    )


async def configuracao_invalida_handler(
    request: Request,
    erro: ConfiguracaoInvalidaError
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            'detail': {
                'message': str(erro),
                'nome_indice': erro.nome_indice
            }
        }
    )


def registrar_handlers_indices(app: FastAPI):
    app.add_exception_handler(
        IndiceExistenteError,
        indice_existente_handler
    )

    app.add_exception_handler(
        IndiceNaoEncontradoError,
        indice_nao_encontrado_handler
    )

    app.add_exception_handler(
        ConfiguracaoInvalidaError,
        configuracao_invalida_handler
    )

