from .tipos import TipoPesquisa
from .strategy.base_strategy import BasePesquisaStrategy
from .strategy.pesquisa_hibrida import PesquisaHibrida
from .strategy.pesquisa_literal import PesquisaLiteral
from .contexto import ContextoPesquisa, ConfiguracaoPesquisaHibrida
from .provedor_embeddings import ProvedorEmbeddings


class FactoryPesquisa:
    def __init__(self, embeddings: ProvedorEmbeddings):
        self._embeddings = embeddings


    def obter_metodo(
        self,
        tipo_pesquisa: TipoPesquisa, 
        contexto: ContextoPesquisa,
        configuracao_hibrida: ConfiguracaoPesquisaHibrida | None
    ) -> BasePesquisaStrategy:
        match tipo_pesquisa:
            case TipoPesquisa.LITERAL:
                return PesquisaLiteral(contexto)
            case TipoPesquisa.HIBRIDA:
                return PesquisaHibrida(
                    contexto=contexto,
                    embeddings=self._embeddings,
                    configuracao=(
                        configuracao_hibrida or ConfiguracaoPesquisaHibrida()
                    )
                )
            case _:
                raise ValueError(
                    f'Tipo de pesquisa não suportado: {tipo_pesquisa}.'
                ) 
