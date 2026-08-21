from fastapi import Request

from backend.api.services.embeddings import ServicoEmbeddings
from backend.config.configuracoes import config

def obter_servico_embeddings(requisicao: Request) -> ServicoEmbeddings:
    return ServicoEmbeddings(
        client=requisicao.app.state.ollama,
        model=config.embeddings_model
    )
