from ..extracao_factory import FactoryExtracao
from ..tipos import FormatoArquivo
from .base_strategy import StrategyExtracaoBase


@FactoryExtracao.registrar(FormatoArquivo.TXT)
class StrategyExtracaoTXT(StrategyExtracaoBase):
    @staticmethod
    def extrair_conteudo(caminho: str) -> str:
        with open(caminho, 'r', encoding='utf-8') as arquivo:
            return arquivo.read().strip()
