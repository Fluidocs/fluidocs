from typing import Any

from .base_strategy import MappingBase
from .documentos_strategy import DocumentosStrategy
from .tipo_mapping import TipoMapping

class MappingFactory:
    _strategies: dict[TipoMapping, type[MappingBase]] = {
        TipoMapping.DOCUMENTOS: DocumentosStrategy
    }

    @classmethod
    def get(cls, tipo: str, **parametros: Any) -> MappingBase:
        try:
            strategy_class = cls._strategies[tipo]
        except KeyError as erro:
            raise ValueError(
                f'Tipo de mapping não suportado: #{erro}'
            )

        return strategy_class(**parametros)