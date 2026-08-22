from elasticsearch import BadRequestError
from typing import Any


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