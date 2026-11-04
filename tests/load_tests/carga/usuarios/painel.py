from locust import task

from carga import validacao
from carga.usuarios.base import FluidocsUser


class PainelUser(FluidocsUser):
    requer_chave_api = True

    @task(1)
    def listar_fontes(self):
        self.requisitar("GET", "/fontes-dados/", validar=validacao.lista_em_dados)

    @task(1)
    def listar_conversas(self):
        self.requisitar("GET", "/api/v1/conversas", validar=validacao.lista_em_dados)
