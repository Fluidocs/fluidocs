import importlib
import pkgutil
from pathlib import Path

from .tipos import FormatoArquivo
from .strategy.base_strategy import StrategyExtracaoBase


class FactoryExtracao:
    _estrategias: dict[FormatoArquivo, type[StrategyExtracaoBase]] = {}

    @classmethod
    def registrar(cls, *formatos: FormatoArquivo):
        def wrapper(
            subclasse: type[StrategyExtracaoBase],
        ) -> type[StrategyExtracaoBase]:
            for formato in formatos:
                cls._estrategias[formato] = subclasse
            return subclasse

        return wrapper

    @classmethod
    def create(cls, formato: FormatoArquivo | str) -> StrategyExtracaoBase:
        try:
            formato_arquivo = FormatoArquivo(str(formato).lower().lstrip('.'))
            estrategia = cls._estrategias[formato_arquivo]
        except (KeyError, ValueError) as erro:
            raise ValueError(
                f'Formato de arquivo não suportado: {formato}'
            ) from erro

        return estrategia()

    @classmethod
    def carregar_extratores(cls) -> None:
        """Importa as strategies para executar seus decorators de registro."""
        caminho_strategies = Path(__file__).parent / 'strategy'

        for _, nome_modulo, _ in pkgutil.iter_modules([str(caminho_strategies)]):
            if nome_modulo.startswith('strategy_extracao_'):
                importlib.import_module(
                    f'.strategy.{nome_modulo}',
                    package=__package__,
                )


FactoryExtracao.carregar_extratores()
