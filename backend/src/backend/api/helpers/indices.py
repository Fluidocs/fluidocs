from fastapi import Request
from backend.api.services.indices import ServicoIndices

def obter_servico_indices(requisicao: Request) -> ServicoIndices:
    return ServicoIndices(
        cliente=requisicao.app.state.elasticsearch
    )
