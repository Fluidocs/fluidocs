from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from backend.core.exceptions import MotorPesquisaIndisponivelError

async def pesquisa_indisponivel_handler(
    request: Request,
    erro: MotorPesquisaIndisponivelError
) -> JSONResponse:
    return JSONResponse(
        status_code=503,
        content={
            'detail': {
                'message': str(erro)
            }
        }
    )

def registrar_core_handlers(app: FastAPI):
    app.add_exception_handler(
        MotorPesquisaIndisponivelError,
        pesquisa_indisponivel_handler
    )