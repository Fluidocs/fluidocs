from locust import task

from carga import validacao
from carga.usuarios.base import FluidocsUser


class SaudeUser(FluidocsUser):
    requer_autenticacao = False

    @task
    def verificar_saude(self):
        self.requisitar("GET", "/health", validar=validacao.health_ok)
