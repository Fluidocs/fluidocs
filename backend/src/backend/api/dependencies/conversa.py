from fastapi import Depends, Request

from backend.api.dependencies.pesquisa import obter_servico_pesquisa
from backend.api.services.pesquisa import ServicoPesquisa
from backend.api.services.conversa import ServicoConversa
from backend.config.configuracoes import config


def obter_servico_conversa(
    requisicao: Request,
    servico_pesquisa: ServicoPesquisa = Depends(obter_servico_pesquisa),
) -> ServicoConversa:
    return ServicoConversa(
        client=requisicao.app.state.ollama, configuracoes=config,
        servico_pesquisa=servico_pesquisa,
    )
