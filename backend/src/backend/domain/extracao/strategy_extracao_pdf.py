from .base_strategy import StrategyExtracaoBase
from .extracao_factory import FactoryExtracao
from typing import List
import pymupdf4llm

@FactoryExtracao.registrar('pdf')
class StrategyExtracaoPDF(StrategyExtracaoBase):
    @staticmethod
    def extrair_conteudo(caminho: str) -> str | List[dict]:
        markdown = pymupdf4llm.to_markdown(
            caminho,
            header=False,
            footer=False,
            use_ocr=True,
            ocr_language='eng+por'
        )

        return markdown
        