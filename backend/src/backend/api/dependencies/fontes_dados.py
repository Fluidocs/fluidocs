from fastapi import Depends
from typing import Annotated

from backend.api.services.fontes_dados import ServicoFontesDeDados
from backend.api.services.indice import ServicoIndice
from .indices import obter_servico_indices

def obter_servico_fontes_de_dados(
    servico_indices: Annotated[
        ServicoIndice,
        Depends(obter_servico_indices)
    ]
) -> ServicoFontesDeDados:
    return ServicoFontesDeDados(
        servico_indices=servico_indices
    )