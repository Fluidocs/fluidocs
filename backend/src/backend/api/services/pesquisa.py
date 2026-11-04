from elasticsearch import AsyncElasticsearch, ConnectionError, ConnectionTimeout, NotFoundError, BadRequestError
from fastapi import HTTPException

from backend.config.configuracoes import config
from ..schemas.backoffice.pesquisa_schemas import PesquisaRequest
from backend.api.helpers.exceptions.elasticsearch import extrair_detalhe_elasticsearch
from backend.api.services.fontes_dados import ServicoFontesDeDados
from backend.domain.pesquisa.factory_pesquisa import FactoryPesquisa
from backend.domain.pesquisa.contexto import ContextoPesquisa, ConfiguracaoPesquisaHibrida
from backend.domain.pesquisa.formatacao.tipos import ResultadoPesquisa
from backend.domain.indices.nome_indice import gerar_nome_indice

from backend.core.exceptions import MotorPesquisaIndisponivelError
from backend.domain.indices.exceptions import IndiceNaoEncontradoError
from backend.domain.pesquisa.exceptions import PesquisaInvalidaError

class ServicoPesquisa:
    def __init__(
        self, 
        client: AsyncElasticsearch,
        factory: FactoryPesquisa,
        servico_fontes: ServicoFontesDeDados
    ):
        self._client = client 
        self._factory = factory
        self._servico_fontes = servico_fontes


    async def pesquisar_async(
        self,
        usuario_id: int,
        dados: PesquisaRequest
    ) -> ResultadoPesquisa:
        if not dados.fonte_dados_ids:
            fontes = await self._servico_fontes.listar_fontes(usuario_id)
            if not fontes:
                raise HTTPException(status_code=404, detail='Nenhuma fonte de dados ativa encontrada.')
            dados = dados.model_copy(update={'fonte_dados_ids': [fonte.id for fonte in fontes]})
        await self._servico_fontes.validar_existencia(dados.fonte_dados_ids, usuario_id)
        nome_indice = gerar_nome_indice(usuario_id)

        try:
            return await self._executar_pesquisa(nome_indice, dados)
        except (ConnectionError, ConnectionTimeout) as erro:
            raise MotorPesquisaIndisponivelError() from erro
        except NotFoundError as erro:
            raise IndiceNaoEncontradoError(nome_indice) from erro
        except BadRequestError as erro:
            detalhe = extrair_detalhe_elasticsearch(erro)
            raise PesquisaInvalidaError(
                nome_indice=nome_indice,
                mensagem='Os parâmetros da pesquisa são inválidos.',
                detalhe=detalhe if config.debug else None
            ) from erro


    async def _executar_pesquisa(
        self,
        nome_indice: str,
        dados: PesquisaRequest
    ) -> ResultadoPesquisa:
        contexto = ContextoPesquisa(
            client=self._client,
            nome_indice=nome_indice,
            fonte_dados_ids=tuple(dados.fonte_dados_ids),
        )

        configuracao_hibrida = ConfiguracaoPesquisaHibrida(
            boost_literal=dados.configuracao_hibrida.boost_literal,
            boost_vetorial=dados.configuracao_hibrida.boost_vetorial,
            similaridade_minima=config.similaridade_minima_vetorial
        )
        
        strategy = self._factory.obter_metodo(
            tipo_pesquisa=dados.tipo_pesquisa,
            contexto=contexto,
            configuracao_hibrida=configuracao_hibrida
        )

        return await strategy.pesquisar(
            pesquisa=dados.q,
            pagina=dados.pagina,
            tamanho=dados.tamanho
        )
