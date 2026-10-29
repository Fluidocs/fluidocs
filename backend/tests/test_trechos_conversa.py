"""Trechos de anexos com SQLite em memória e pesquisa/modelo simulados."""
import os
import importlib.util
import sqlite3
import unittest
from pathlib import Path
from contextlib import closing
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

with patch.dict(os.environ, {
    'SECRET_KEY': 'segredo-ficticio-exclusivo-dos-testes-fluidocs',
    'USUARIO_BD': 'teste', 'SENHA_BD': 'teste', 'HOST_BD': 'isolado', 'NOME_BD': 'teste',
}):
    from fastapi import HTTPException
    from tortoise import Tortoise
    from backend.api.models.anexo import Anexo
    from backend.api.models.usuario import Usuario
    from backend.api.schemas.backoffice.conversa_schemas import ConversaRequest
    from backend.api.services.conversa import ServicoConversa


class TrechosConversa(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        await Tortoise.init(db_url='sqlite://:memory:', modules={'models': ['backend.api.models']})
        await Tortoise.generate_schemas()
        self.usuario = await Usuario.create(nome='Conta A', email='a@example.com', senha='hash-ficticio')
        self.outra = await Usuario.create(nome='Conta B', email='b@example.com', senha='hash-ficticio')
        self.client = SimpleNamespace(generate=AsyncMock(return_value={'response': 'O prazo é de 30 dias.'}))
        self.pesquisa = SimpleNamespace(pesquisar_async=AsyncMock(return_value=SimpleNamespace(documentos=[
            SimpleNamespace(fonte_dados_id=12, documento_id='sem-trecho', nome_documento='sem-trecho.pdf',
                            trechos=[SimpleNamespace(id_trecho=1, pontuacao=3, conteudo=' \n\t ')]),
            SimpleNamespace(fonte_dados_id=12, documento_id='manual', nome_documento='manual.pdf',
                            trechos=[SimpleNamespace(id_trecho=0, pontuacao=2, conteudo='O prazo é de 30 dias.')]),
        ])))
        config = SimpleNamespace(ollama_chat_model='modelo-ficticio', ollama_max_history_chars=4000,
                                 ollama_max_context_chars=16000, ollama_max_response_tokens=384,
                                 ollama_keep_alive='30m')
        self.servico = ServicoConversa(self.client, config, self.pesquisa)

    async def asyncTearDown(self):
        await Tortoise.close_connections()

    async def test_trecho_persistido_retorna_no_envio_e_no_historico_sem_documento_vazio(self):
        resposta = await self.servico.responder(self.usuario, ConversaRequest(pergunta='Qual é o prazo?', fonte_dados_ids=[12]))
        self.assertEqual([(a.nome, a.trecho) for a in resposta.anexos], [('manual.pdf', 'O prazo é de 30 dias.')])
        detalhe = await self.servico.detalhar(resposta.conversa_id, self.usuario.id)
        self.assertEqual(detalhe.mensagens[-1].anexos[0].model_dump(), resposta.anexos[0].model_dump())
        self.assertEqual(await Anexo.all().count(), 1)
        self.assertNotIn('sem-trecho.pdf', self.client.generate.call_args.kwargs['prompt'])
        with self.assertRaises(HTTPException) as erro:
            await self.servico.detalhar(resposta.conversa_id, self.outra.id)
        self.assertEqual(erro.exception.status_code, 404)

    async def test_sem_trechos_nao_gera_anexos_nem_chama_modelo(self):
        self.pesquisa.pesquisar_async.return_value.documentos = self.pesquisa.pesquisar_async.return_value.documentos[:1]
        resposta = await self.servico.responder(self.usuario, ConversaRequest(pergunta='Qual é o prazo?', fonte_dados_ids=[12]))
        self.assertEqual(resposta.anexos, [])
        self.client.generate.assert_not_awaited()

    async def test_migracao_preserva_anexos_antigos_com_trecho_nulo(self):
        caminho = Path(__file__).parents[1] / 'src/backend/db/migrations/models/5_20261028211500_adicionar_trecho_anexo.py'
        spec = importlib.util.spec_from_file_location('migracao_trecho', caminho)
        migracao = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(migracao)
        with closing(sqlite3.connect(':memory:')) as db:
            db.executescript('CREATE TABLE anexo (id INTEGER PRIMARY KEY, nome TEXT); INSERT INTO anexo VALUES (1, \'antigo.pdf\');')
            db.executescript(await migracao.upgrade(None))
            self.assertEqual(db.execute('SELECT nome, trecho FROM anexo').fetchall(), [('antigo.pdf', None)])
            db.execute('INSERT INTO anexo VALUES (?, ?, ?)', (2, 'novo.pdf', 'Trecho novo.'))
            self.assertEqual(db.execute('SELECT trecho FROM anexo WHERE id=2').fetchone(), ('Trecho novo.',))
            db.executescript(await migracao.downgrade(None))
            self.assertEqual(db.execute('SELECT nome FROM anexo ORDER BY id').fetchall(), [('antigo.pdf',), ('novo.pdf',)])


if __name__ == '__main__':
    unittest.main()
