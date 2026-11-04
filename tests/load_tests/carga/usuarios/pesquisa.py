import random

from locust import task

from carga import validacao
from carga.usuarios.base import FluidocsUser


class _PesquisaUser(FluidocsUser):
    abstract = True
    requer_autenticacao = False
    requer_chave_api = True
    requer_fontes = True
    tipo_pesquisa: str

    @task
    def pesquisar(self):
        self.requisitar(
            "POST", "/api/v1/pesquisar", nome=f"POST /api/v1/pesquisar [{self.tipo_pesquisa}]",
            validar=validacao.lista_em_dados,
            json={
                "q": random.choice(self.configuracao.consultas),
                "fonte_dados_ids": list(self.configuracao.fontes),
                "tipo_pesquisa": self.tipo_pesquisa, "pagina": 1, "tamanho": 10,
            },
        )


class PesquisaLiteralUser(_PesquisaUser):
    tipo_pesquisa = "literal"


class PesquisaHibridaUser(_PesquisaUser):
    tipo_pesquisa = "hibrida"
