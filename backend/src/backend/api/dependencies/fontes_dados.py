from fastapi import Depends
from typing import Annotated

from backend.api.services.fontes_dados import ServicoFontesDeDados

def obter_servico_fontes_de_dados():
    return ServicoFontesDeDados()