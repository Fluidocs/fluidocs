"""Contrato real de fontes com SQLite em memória e limpeza de índice simulada.

Execute: .venv/Scripts/python.exe -m unittest discover -s tests -v
Nenhum banco ou serviço de trabalho é utilizado.
"""
import os
import unittest
from contextlib import asynccontextmanager
from unittest.mock import patch

from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from tortoise import Tortoise

# A importação de backend carrega a configuração; use apenas valores fictícios.
with patch.dict(os.environ, {
    'SECRET_KEY': 'segredo-ficticio-exclusivo-dos-testes-fluidocs',
    'USUARIO_BD': 'teste', 'SENHA_BD': 'teste', 'HOST_BD': 'isolado', 'NOME_BD': 'teste',
}):
    from backend.api.core.auth.gerador_hash import GeradorHash
    from backend.api.dependencies.indices import obter_servico_indices
    from backend.api.models.usuario import Usuario
    from backend.api.routes.router import build_router


class IndiceIsolado:
    def __init__(self):
        self.remocoes = []
        self.indisponivel = False

    async def remover_documentos_da_fonte(self, usuario_id, fonte_id):
        if self.indisponivel:
            raise HTTPException(status_code=503, detail='Índice indisponível no teste.')
        self.remocoes.append((usuario_id, fonte_id))
        return 0


def criar_app_isolado():
    indice = IndiceIsolado()

    @asynccontextmanager
    async def lifespan(app):
        await Tortoise.init(
            db_url='sqlite://:memory:',
            modules={'models': ['backend.api.models']},
            _enable_global_fallback=True,
        )
        await Tortoise.generate_schemas()
        senha = GeradorHash().gerar_hash_senha('senha-ficticia-de-teste')
        for nome, email in [('Conta A', 'a@example.com'), ('Conta B', 'b@example.com')]:
            await Usuario.create(nome=nome, email=email, senha=senha)
        try:
            yield
        finally:
            await Tortoise.close_connections()

    app = FastAPI(lifespan=lifespan)
    app.include_router(build_router())
    app.dependency_overrides[obter_servico_indices] = lambda: indice
    return app, indice


class ContratoFontesDados(unittest.TestCase):
    def setUp(self):
        app, self.indice = criar_app_isolado()
        self.client = TestClient(app)
        self.client.__enter__()
        self.addCleanup(self.client.__exit__, None, None, None)
        self.a = self.login('a@example.com')
        self.b = self.login('b@example.com')

    def login(self, email):
        resposta = self.client.post('/auth/login', data={
            'username': email, 'password': 'senha-ficticia-de-teste',
        })
        self.assertEqual(resposta.status_code, 200)
        return {'Authorization': f"Bearer {resposta.json()['access_token']}"}

    def criar(self, headers=None, **dados):
        resposta = self.client.post('/fontes-dados/', headers=headers or self.a, json={
            'nome': 'RH', 'descricao': '', **dados,
        })
        self.assertEqual(resposta.status_code, 201, resposta.text)
        return resposta.json()['dados']

    def test_crud_persiste_e_retorna_o_contrato_do_frontend(self):
        fonte = self.criar(descricao='Políticas internas')
        self.assertEqual(set(fonte), {'id', 'nome', 'descricao', 'data_criacao', 'data_atualizacao'})
        self.assertIsInstance(fonte['id'], int)
        self.assertEqual(self.client.get('/fontes-dados/', headers=self.a).json()['dados'], [fonte])
        url = f"/fontes-dados/{fonte['id']}"
        self.assertEqual(self.client.get(url, headers=self.a).json()['dados'], fonte)
        alterada = self.client.patch(url, headers=self.a, json={'nome': 'RH atualizado', 'descricao': ''})
        self.assertEqual(alterada.status_code, 200, alterada.text)
        self.assertEqual(alterada.json()['dados']['descricao'], '')
        self.assertEqual(alterada.json()['dados']['data_criacao'], fonte['data_criacao'])
        self.assertEqual(self.client.get(url, headers=self.a).json()['dados']['nome'], 'RH atualizado')
        removida = self.client.delete(url, headers=self.a)
        self.assertEqual(removida.status_code, 202, removida.text)
        self.assertEqual(removida.json()['dados']['id'], fonte['id'])
        self.assertEqual(self.indice.remocoes, [(1, fonte['id'])])
        self.assertEqual(self.client.get('/fontes-dados/', headers=self.a).json()['dados'], [])
        self.assertEqual(self.client.get(url, headers=self.a).status_code, 404)

    def test_outra_conta_nao_lista_le_edita_nem_exclui_a_fonte(self):
        fonte = self.criar()
        url = f"/fontes-dados/{fonte['id']}"
        self.assertEqual(self.client.get('/fontes-dados/', headers=self.b).json()['dados'], [])
        for metodo, dados in [('get', {}), ('patch', {'json': {'nome': 'Invasão'}}), ('delete', {})]:
            with self.subTest(metodo=metodo):
                self.assertEqual(getattr(self.client, metodo)(url, headers=self.b, **dados).status_code, 404)
        self.assertEqual(self.indice.remocoes, [])
        self.assertEqual(self.client.get(url, headers=self.a).json()['dados']['nome'], 'RH')
        self.assertEqual(self.criar(headers=self.b)['nome'], 'RH')

    def test_todas_as_operacoes_exigem_jwt(self):
        for metodo, url, dados in [
            ('get', '/fontes-dados/', {}),
            ('post', '/fontes-dados/', {'json': {'nome': 'RH', 'descricao': ''}}),
            ('get', '/fontes-dados/1', {}),
            ('patch', '/fontes-dados/1', {'json': {'nome': 'TI'}}),
            ('delete', '/fontes-dados/1', {}),
        ]:
            with self.subTest(metodo=metodo):
                self.assertEqual(getattr(self.client, metodo)(url, **dados).status_code, 401)

    def test_limites_da_criacao_e_patch_vazio(self):
        fonte = self.criar(nome='a' * 100, descricao='b' * 250)
        for dados in [{'nome': 'a' * 101, 'descricao': ''}, {'nome': 'RH', 'descricao': 'b' * 251}]:
            self.assertEqual(self.client.post('/fontes-dados/', headers=self.a, json=dados).status_code, 422)
        self.assertEqual(self.client.patch(f"/fontes-dados/{fonte['id']}", headers=self.a, json={}).status_code, 422)

    def test_falha_no_indice_permite_repetir_a_exclusao_sem_confirmar_sucesso(self):
        fonte = self.criar()
        url = f"/fontes-dados/{fonte['id']}"
        self.indice.indisponivel = True
        self.assertEqual(self.client.delete(url, headers=self.a).status_code, 503)
        self.indice.indisponivel = False
        self.assertEqual(self.client.delete(url, headers=self.a).status_code, 202)
        self.assertEqual(self.client.get('/fontes-dados/', headers=self.a).json()['dados'], [])


if __name__ == '__main__':
    unittest.main()
