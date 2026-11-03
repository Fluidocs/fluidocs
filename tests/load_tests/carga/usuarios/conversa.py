import random

from locust import between, task

from carga import validacao
from carga.usuarios.base import FluidocsUser


class ConversaUser(FluidocsUser):
    requer_autenticacao = False
    requer_chave_api = True
    requer_fontes = True
    wait_time = between(5, 10)

    @task
    def perguntar(self):
        self.requisitar(
            "POST", "/api/v1/conversas/perguntar", validar=validacao.conversa_criada,
            json={
                "pergunta": random.choice(self.configuracao.consultas),
                "fonte_dados_ids": list(self.configuracao.fontes),
            },
        )
