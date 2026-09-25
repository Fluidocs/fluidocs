from fastapi import APIRouter

from .auth_routes import auth_router
from .backoffice.chave_api_routes import chave_api_router
from .backoffice.rotas_indexacao import indexacao_router
from .backoffice.fontes_dados_routes import fontes_dados_router
from .backoffice.usuario_routes import usuario_router
from .public.v1.conversa_routes import conversa_router

from .public.v1 import v1_router

def build_router() -> APIRouter:
    router = APIRouter()

    router.include_router(auth_router, prefix='/auth')
    
    router.include_router(usuario_router)
    router.include_router(fontes_dados_router)
    router.include_router(chave_api_router, prefix='/chaves-api')
    router.include_router(indexacao_router, prefix='/indexar')

    router.include_router(v1_router, prefix='/api')

    return router