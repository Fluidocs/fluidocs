import pkgutil, importlib
from pathlib import Path
from typing import Dict, Type
from .base_strategy import StrategyExtracaoBase

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
        """Varre o diretório atual e importa módulos para disparar o decorator @registrar."""
        caminho_atual = Path(__file__).parent
        
        for _, nome_modulo, _ in pkgutil.iter_modules([str(caminho_atual)]):
            if nome_modulo not in ["fabrica_extracao", "base"]:
                importlib.import_module(f".{nome_modulo}", package=__package__)

FactoryExtracao.carregar_extratores()
