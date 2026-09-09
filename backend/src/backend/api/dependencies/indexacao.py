from fastapi import Request, Depends

from backend.api.dependencies.fontes_dados import obter_servico_fontes_de_dados
from backend.api.services.indexacao.submissao_indexacao import ServicoSubmissaoIndexacao
from backend.api.services.fontes_dados import ServicoFontesDeDados


async def obter_servico_submissao_indexacao(
    requisicao: Request,
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados)
) -> ServicoSubmissaoIndexacao:
    return ServicoSubmissaoIndexacao(
        cliente=requisicao.app.state.elasticsearch,
        servico_fontes=servico_fontes
    )
