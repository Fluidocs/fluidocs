import uvicorn
from backend.config.configuracoes import config
from backend.config.inicializacao import inicializar_app


def main() -> None:
    app = inicializar_app()

    uvicorn.run(
        app,
        host=config.server_host,
        port=config.server_port
    )


if __name__ == "__main__":
    main()