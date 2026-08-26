from config.configuracoes import configuracoes

usuario = configuracoes.usuario_bd
senha = configuracoes.senha_bd
host = configuracoes.host_bd
porta = configuracoes.porta_bd
nome = configuracoes.nome_bd

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
