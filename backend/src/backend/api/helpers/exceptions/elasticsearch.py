from collections.abc import Awaitable, Callable
from functools import wraps
from typing import Any, ParamSpec, TypeVar

from elasticsearch import BadRequestError
from elastic_transport import ConnectionError, ConnectionTimeout

from backend.core.exceptions import MotorPesquisaIndisponivelError


P = ParamSpec('P')
R = TypeVar('R')


def tratar_indisponibilidade_elasticsearch(
    funcao: Callable[P, Awaitable[R]],
) -> Callable[P, Awaitable[R]]:
    @wraps(funcao)
    async def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        try:
            return await funcao(*args, **kwargs)
        except (ConnectionError, ConnectionTimeout) as erro:
            raise MotorPesquisaIndisponivelError() from erro

    return wrapper


def extrair_detalhe_elasticsearch(
    erro: BadRequestError,
) -> str | None:
    body: Any = getattr(erro, "body", None)

    if not isinstance(body, dict):
        return None

    conteudo_erro = body.get("error")

    if isinstance(conteudo_erro, str):
        return conteudo_erro

    if not isinstance(conteudo_erro, dict):
        return None

    causas = conteudo_erro.get("root_cause", [])

    if causas and isinstance(causas[0], dict):
        return causas[0].get("reason")

    return conteudo_erro.get("reason")
