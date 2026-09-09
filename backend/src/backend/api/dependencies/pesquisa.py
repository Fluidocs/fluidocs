from fastapi import Request, Depends
from typing import Annotated

from backend.api.services.pesquisa import ServicoPesquisa
from backend.api.services.fontes_dados import ServicoFontesDeDados
from backend.api.services.embeddings.pesquisa import ProvedorEmbeddingsPesquisa
from backend.api.dependencies.embeddings import obter_provedor_embeddings_pesquisa
from backend.api.dependencies.fontes_dados import obter_servico_fontes_de_dados
from backend.domain.pesquisa.factory_pesquisa import FactoryPesquisa


def obter_factory_pesquisa(
    servico_embeddings: Annotated[
        ProvedorEmbeddingsPesquisa,
        Depends(obter_provedor_embeddings_pesquisa)
    ]
) -> FactoryPesquisa:
    return FactoryPesquisa(
        embeddings=servico_embeddings
    )


def obter_servico_pesquisa(
    requisicao: Request,
    factory_pesquisa: FactoryPesquisa = Depends(obter_factory_pesquisa),
    servico_fontes: ServicoFontesDeDados = Depends(obter_servico_fontes_de_dados)
) -> ServicoPesquisa:
    return ServicoPesquisa(
        client=requisicao.app.state.elasticsearch,
        factory=factory_pesquisa,
        servico_fontes=servico_fontes,
    )
