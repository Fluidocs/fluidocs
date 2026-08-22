from functools import wraps
from fastapi import Request
from backend.api.services.pesquisa import ServicoPesquisa
from backend.api.services.embeddings import ServicoEmbeddings
from backend.domain.pesquisa.factory_pesquisa import FactoryPesquisa
from backend.config.configuracoes import config

from elastic_transport import (
    ConnectionError,
    ConnectionTimeout
)
from backend.core.exceptions import (
    MotorPesquisaIndisponivelError
)


def tratar_motor_pesquisa(func):
    @wraps(func)
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except (
            ConnectionError,
            ConnectionTimeout,
        ) as erro:
            raise MotorPesquisaIndisponivelError() from erro

    return wrapper


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
