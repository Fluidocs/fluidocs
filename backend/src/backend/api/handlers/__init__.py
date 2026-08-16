from fastapi import FastAPI

from .core_handler import registrar_core_handlers
from .indices_handler import registrar_handlers_indices

def registrar_exception_handlers(app: FastAPI):
    registrar_core_handlers(app)
    registrar_handlers_indices(app)