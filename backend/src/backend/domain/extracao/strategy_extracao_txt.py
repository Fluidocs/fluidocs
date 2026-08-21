from .base_strategy import StrategyExtracaoBase
from .extracao_factory import FactoryExtracao
from typing import List

@FactoryExtracao.registrar('txt')
class StrategyExtracaoTXT(StrategyExtracaoBase):
    @staticmethod
    def extrair_conteudo(caminho: str) -> str | List[dict]:
        with open(caminho, 'r', encoding='utf-8') as arquivo:
            return arquivo.read().strip() 
