from fastapi import Request, Depends
from typing import Annotated

from backend.api.services.pesquisa import ServicoPesquisa
from backend.api.services.embeddings.pesquisa import ProvedorEmbeddingsPesquisa
from backend.api.dependencies.embeddings import obter_provedor_embeddings_pesquisa
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
    factory_pesquisa: FactoryPesquisa = Depends(obter_factory_pesquisa)
) -> ServicoPesquisa:
    return ServicoPesquisa(
        client=requisicao.app.state.elasticsearch,
        factory=factory_pesquisa
    )
