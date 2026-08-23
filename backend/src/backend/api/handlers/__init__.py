from fastapi import FastAPI

from .core_handler import registrar_core_handlers
from .indices_handler import registrar_handlers_indices
from .indexacao_handler import registrar_indexacao_handlers
from .pesquisa_handler import registrar_pesquisa_handlers

def registrar_exception_handlers(app: FastAPI):
    registrar_core_handlers(app)
    registrar_handlers_indices(app)
    registrar_indexacao_handlers(app)
    registrar_pesquisa_handlers(app)
