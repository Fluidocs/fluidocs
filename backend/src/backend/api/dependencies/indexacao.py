from fastapi import Request

from backend.api.services.indexacao.submissao_indexacao import (
    ServicoSubmissaoIndexacao,
)


async def obter_servico_submissao_indexacao(
    requisicao: Request,
) -> ServicoSubmissaoIndexacao:
    return ServicoSubmissaoIndexacao(
        cliente=requisicao.app.state.elasticsearch,
    )
