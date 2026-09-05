from fastapi import Request

from backend.api.services.embeddings.pesquisa import ProvedorEmbeddingsPesquisa
from backend.config.configuracoes import config


def obter_provedor_embeddings_pesquisa(
    requisicao: Request
) -> ProvedorEmbeddingsPesquisa:
    return ProvedorEmbeddingsPesquisa(
        cliente=requisicao.app.state.embeddings,
        modelo=config.embeddings_model
    )