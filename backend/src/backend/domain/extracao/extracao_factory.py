import importlib
import pkgutil
from pathlib import Path
from typing import Dict, Type

from .strategy.base_strategy import StrategyExtracaoBase

class FactoryExtracao:
    _estrategias: Dict[str, Type[StrategyExtracaoBase]] = {}

    @classmethod
    def registrar(cls, *extensoes: str):
        def wrapper(subclasse: Type[StrategyExtracaoBase]):
            for ext in extensoes:
                cls._estrategias[ext.lower().lstrip('.')] = subclasse
            return subclasse
        return wrapper


    @classmethod
    def create(cls, extensao: str) -> Type[StrategyExtracaoBase]:
        ext = extensao.lower().lstrip('.')
        estrategia = cls._estrategias.get(ext)

        if not estrategia:
            raise ValueError(f'Formato de arquivo não suportado: {extensao}')

        return estrategia


    @classmethod
    def carregar_extratores(cls):
        """Importa as strategies para executar seus decorators de registro."""
        caminho_strategies = Path(__file__).parent / 'strategy'

        for _, nome_modulo, _ in pkgutil.iter_modules([str(caminho_strategies)]):
            if nome_modulo.startswith('strategy_extracao_'):
                importlib.import_module(
                    f'.strategy.{nome_modulo}',
                    package=__package__,
                )

FactoryExtracao.carregar_extratores()
