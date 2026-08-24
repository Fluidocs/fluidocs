from fastapi import Request
from backend.api.services.pesquisa import ServicoPesquisa
from backend.api.services.embeddings import ServicoEmbeddings
from backend.domain.pesquisa.factory_pesquisa import FactoryPesquisa
from backend.config.configuracoes import config

def obter_servico_pesquisa(requisicao: Request):
    embeddings = ServicoEmbeddings(
        client=requisicao.app.state.ollama,
        model=config.embeddings_model
    )

    factory = FactoryPesquisa(embeddings)

    return ServicoPesquisa(
        client=requisicao.app.state.elasticsearch,
        factory=factory
    )
