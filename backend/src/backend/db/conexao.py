from backend.config.configuracoes import config

usuario = config.usuario_bd
senha = config.senha_bd
host = config.host_bd
porta = config.porta_bd
nome = config.nome_bd

URL_BANCO_DADOS = f"postgres://{usuario}:{senha}@{host}:{porta}/{nome}"
print(f"URL do banco de dados: postgres://{usuario}:***@{host}:{porta}/{nome}")
TORTOISE_CONFIG = {
    "connections": {
        "default": URL_BANCO_DADOS
    },
    "apps": {
        "models": {
            "models": [
                "api.models.chat_llm",
                "api.models.credencial_integracao",
                "api.models.grupo_acesso",
                "api.models.integracao",
                "api.models.organizacao",
                "api.models.repositorio",
                "api.models.usuario",
                "aerich.models"
            ],
            "default_connection": "default"
        }
    }
}
