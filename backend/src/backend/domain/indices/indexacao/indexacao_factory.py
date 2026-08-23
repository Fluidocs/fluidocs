from typing import Any

from backend.domain.indices.mapping.tipo_mapping import TipoMapping

from .strategy.base_strategy import IndexacaoBase
from .strategy.documentos_strategy import DocumentosIndexacaoStrategy


class IndexacaoFactory:
    """Seleciona a montagem dos documentos de acordo com o mapping do índice."""

    _strategies: dict[TipoMapping, type[IndexacaoBase]] = {
        TipoMapping.DOCUMENTOS: DocumentosIndexacaoStrategy,
    }

    @classmethod
    def get(cls, tipo: TipoMapping | str, **parametros: Any) -> IndexacaoBase:
        try:
            tipo_mapping = TipoMapping(tipo)
            strategy_class = cls._strategies[tipo_mapping]
        except (KeyError, ValueError) as erro:
            raise ValueError(
                f'Tipo de indexação não suportado: {tipo}'
            ) from erro

        return strategy_class(**parametros)
