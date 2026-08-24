import pymupdf4llm

from ..extracao_factory import FactoryExtracao
from ..tipos import FormatoArquivo
from .base_strategy import StrategyExtracaoBase


@FactoryExtracao.registrar(FormatoArquivo.PDF)
class StrategyExtracaoPDF(StrategyExtracaoBase):
    @staticmethod
    def extrair_conteudo(caminho: str) -> str:
        markdown = pymupdf4llm.to_markdown(
            caminho,
            header=False,
            footer=False,
            use_ocr=True,
            ocr_language='eng+por'
        )

        return markdown
