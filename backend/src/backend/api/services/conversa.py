from pathlib import PurePosixPath

from fastapi import HTTPException
from httpx import HTTPError
from ollama import AsyncClient, ResponseError
from tortoise import timezone
from tortoise.transactions import in_transaction

from backend.api.models.conversa import Conversa
from backend.api.models.anexo import Anexo
from backend.api.models.mensagem import Mensagem, PapelMensagem
from backend.api.models.usuario import Usuario
from backend.api.schemas.backoffice.conversa_schemas import (
    ConversaRequest,
    ContextoConversa,
    ConversaDetalheResponse,
    ConversaResumoResponse,
    MensagemResponse,
    AnexoResponse,
    MensagemHistorico,
    ResponderConversaResponse,
    TrechoContexto,
)
from backend.api.schemas.backoffice.pesquisa_schemas import PesquisaRequest
from backend.api.services.pesquisa import ServicoPesquisa
from backend.config.configuracoes import Configuracoes
from backend.domain.conversa.resposta import responder_conversa


class ServicoConversa:
    def __init__(
        self, client: AsyncClient, configuracoes: Configuracoes,
        servico_pesquisa: ServicoPesquisa,
    ):
        self._client = client
        self._config = configuracoes
        self._servico_pesquisa = servico_pesquisa

    async def obter(self, conversa_id: int, usuario_id: int) -> Conversa:
        conversa = await Conversa.get_or_none(id=conversa_id, usuario_id=usuario_id)
        if conversa is None:
            raise HTTPException(status_code=404, detail='Conversa nao encontrada.')
        return conversa

    async def criar(self, usuario_id: int) -> Conversa:
        return await Conversa.create(usuario_id=usuario_id, titulo='')

    async def renomear(self, conversa_id: int, usuario_id: int, titulo: str) -> Conversa:
        conversa = await self.obter(conversa_id, usuario_id)
        # Atualiza somente o titulo, preservando eventuais mensagens concorrentes.
        atualizadas = await Conversa.filter(id=conversa.id, usuario_id=usuario_id).update(titulo=titulo)
        if not atualizadas:
            raise HTTPException(status_code=404, detail='Conversa nao encontrada.')
        return await self.obter(conversa_id, usuario_id)

    async def deletar(self, conversa_id: int, usuario_id: int) -> Conversa:
        conversa = await self.obter(conversa_id, usuario_id)
        await conversa.delete()
        return conversa

    async def responder(
        self, usuario: Usuario, dados: ConversaRequest,
    ) -> ResponderConversaResponse:
        if not dados.fonte_dados_ids:
            raise HTTPException(status_code=422, detail='Informe ao menos uma fonte de dados para conversar.')
        conversa = None
        historico = []
        if dados.conversa_id is not None:
            conversa = await self.obter(dados.conversa_id, usuario.id)
            caracteres = 0
            async for mensagem in Mensagem.filter(conversa_id=conversa.id).order_by('-id').limit(20):
                papel = 'user' if mensagem.papel == PapelMensagem.USUARIO else 'assistant'
                caracteres += len(f'{papel}: {mensagem.conteudo}')
                if caracteres > self._config.ollama_max_history_chars:
                    break
                historico.append(MensagemHistorico(papel=papel, conteudo=mensagem.conteudo))

        pesquisa = await self._servico_pesquisa.pesquisar_async(
            usuario_id=usuario.id,
            dados=PesquisaRequest(q=dados.pergunta, fonte_dados_ids=dados.fonte_dados_ids, tamanho=5),
        )
        trechos = [
            TrechoContexto(
                id_trecho=trecho.id_trecho, fonte_dados_id=documento.fonte_dados_id,
                documento_id=documento.documento_id,
                nome_documento=documento.nome_documento,
                pontuacao=trecho.pontuacao, conteudo=trecho.conteudo,
            )
            for documento in pesquisa.documentos
            for trecho in documento.trechos
            if trecho.conteudo and trecho.conteudo.strip()
        ]
        contexto = ContextoConversa(
            **dados.model_dump(), historico=list(reversed(historico)),
            trechos=trechos,
        )
        # Consulta o valor atual, inclusive quando o servico recebe um Usuario
        # carregado antes de uma atualizacao do perfil.
        usuario_atual = await Usuario.get(id=usuario.id)

        try:
            resposta = await responder_conversa(
                client=self._client,
                payload=contexto,
                chat_model=self._config.ollama_chat_model,
                max_context_chars=self._config.ollama_max_context_chars,
                max_history_chars=self._config.ollama_max_history_chars,
                max_response_tokens=self._config.ollama_max_response_tokens,
                keep_alive=self._config.ollama_keep_alive,
                comportamento_ia=usuario_atual.comportamento_ia,
            )
        except (HTTPError, ConnectionError, ResponseError) as erro:
            raise HTTPException(
                status_code=503, detail='O servico de conversa esta indisponivel no momento.',
            ) from erro

        # A inferencia ocorre fora da transacao. Uma resposta com historico
        # desatualizado nao pode sobrescrever uma interacao concorrente.
        async with in_transaction() as conexao:
            if conversa is None:
                conversa_salva = await Conversa.create(
                    titulo=dados.pergunta[:255],
                    usuario_id=usuario.id,
                    using_db=conexao,
                )
            else:
                conversa_salva = await Conversa.filter(
                    id=conversa.id, usuario_id=usuario.id,
                ).using_db(conexao).select_for_update().first()
                if conversa_salva is None:
                    raise HTTPException(status_code=404, detail='Conversa nao encontrada.')
                if conversa_salva.data_ultima_interacao != conversa.data_ultima_interacao:
                    raise HTTPException(
                        status_code=409,
                        detail='A conversa recebeu outra mensagem. Envie a pergunta novamente.',
                    )

            await Mensagem.create(
                conversa_id=conversa_salva.id, papel=PapelMensagem.USUARIO,
                conteudo=dados.pergunta, using_db=conexao,
            )
            mensagem_assistente = await Mensagem.create(
                conversa_id=conversa_salva.id, papel=PapelMensagem.ASSISTENTE,
                conteudo=resposta.resposta, using_db=conexao,
            )
            anexos = []
            for trecho in resposta.trechos_anexos:
                nome = trecho.nome_documento or 'Documento.txt'
                extensao = PurePosixPath(nome).suffix.lstrip('.').lower()
                anexo = await Anexo.create(
                    mensagem_id=mensagem_assistente.id, nome=nome[:255],
                    extensao=extensao[:4] or 'txt',
                    using_db=conexao,
                )
                anexos.append(AnexoResponse.model_validate(anexo))
            conversa_salva.data_ultima_interacao = timezone.now()
            campos_atualizados = ['data_ultima_interacao']
            if not conversa_salva.titulo:
                conversa_salva.titulo = dados.pergunta[:255]
                campos_atualizados.append('titulo')
            await conversa_salva.save(
                using_db=conexao, update_fields=campos_atualizados,
            )

        return ResponderConversaResponse(
            conversa_id=conversa_salva.id, resposta=resposta.resposta, anexos=anexos,
        )

    async def listar(
        self, usuario_id: int, pagina: int, por_pagina: int,
    ) -> tuple[list[ConversaResumoResponse], int]:
        consulta = Conversa.filter(usuario_id=usuario_id)
        total = await consulta.count()
        conversas = await consulta.order_by('-data_ultima_interacao', '-id').offset(
            (pagina - 1) * por_pagina,
        ).limit(por_pagina)
        return [ConversaResumoResponse.model_validate(conversa) for conversa in conversas], total

    async def detalhar(self, conversa_id: int, usuario_id: int) -> ConversaDetalheResponse:
        conversa = await self.obter(conversa_id, usuario_id)
        mensagens = await conversa.mensagens.all().order_by('id').prefetch_related('anexos')
        return ConversaDetalheResponse(
            **ConversaResumoResponse.model_validate(conversa).model_dump(),
            mensagens=[MensagemResponse(
                id=mensagem.id, conversa_id=mensagem.conversa_id,
                conteudo=mensagem.conteudo, papel=mensagem.papel, data_envio=mensagem.data_envio,
                anexos=[AnexoResponse.model_validate(anexo) for anexo in mensagem.anexos],
            ) for mensagem in mensagens],
        )
