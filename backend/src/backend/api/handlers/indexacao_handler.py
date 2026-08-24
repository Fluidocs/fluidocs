from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.domain.indices.indexacao.exceptions import (
    ArquivoIndexacaoInvalidoError,
)


async def arquivo_indexacao_invalido_handler(
    request: Request,
    erro: ArquivoIndexacaoInvalidoError,
) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={
            'detail': {
                'message': str(erro),
            }
        },
    )


def registrar_indexacao_handlers(app: FastAPI) -> None:
    app.add_exception_handler(
        ArquivoIndexacaoInvalidoError,
        arquivo_indexacao_invalido_handler,
    )
