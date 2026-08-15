from fastapi import FastAPI
from contextlib import asynccontextmanager

from .configuracoes import config
from backend.api.schemas.base_response import BaseResponse
from backend.api.schemas.health_response import HealthResponse

@asynccontextmanager
async def lifespan(app: FastAPI):
    # [TODO] Elasticsearch Assíncrono

    # [TODO] Modelo de Embeddings

    # [TODO] Adicionar aerich (conexão com o banco)

    yield

def inicializar_app() -> FastAPI:
    app = FastAPI(
        debug=config.debug,
        title="Fluidocs API",
        description=(
            "Middleware inteligente, focado em busca lexical, semântica ou híbrida sobre os seus dados."
        ),
        version='1.0',
        lifespan=lifespan
    )

    @app.get("/health", response_model=BaseResponse[HealthResponse])
    async def health():
        return {
            'dados': { 'status_code': 200 }
        }

    return app
