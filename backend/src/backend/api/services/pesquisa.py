from elasticsearch import AsyncElasticsearch, ConnectionError, ConnectionTimeout, NotFoundError, BadRequestError

from backend.config.configuracoes import config
from ..schemas.routes.pesquisa.pesquisa_request import PesquisaRequest
from backend.api.helpers.exceptions.elasticsearch import extrair_detalhe_elasticsearch
from backend.domain.pesquisa.factory_pesquisa import FactoryPesquisa
from backend.domain.pesquisa.contexto import ContextoPesquisa, ConfiguracaoPesquisaHibrida
from backend.domain.pesquisa.formatacao.tipos import ResultadoPesquisa

from backend.core.exceptions import MotorPesquisaIndisponivelError
from backend.domain.indices.exceptions import IndiceNaoEncontradoError
from backend.domain.pesquisa.exceptions import PesquisaInvalidaError

class ServicoPesquisa:
    def __init__(
        self, 
        client: AsyncElasticsearch,
        factory: FactoryPesquisa
    ):
        self._client = client 
        self._factory = factory


    async def pesquisar_async(
        self,
        dados: PesquisaRequest
    ) -> ResultadoPesquisa:
        try:
            return await self._executar_pesquisa(dados)
        except (ConnectionError, ConnectionTimeout) as erro:
            raise MotorPesquisaIndisponivelError() from erro
        except NotFoundError as erro:
            raise IndiceNaoEncontradoError(dados.nome_indice) from erro
        except BadRequestError as erro:
            detalhe = extrair_detalhe_elasticsearch(erro)
            raise PesquisaInvalidaError(
                nome_indice=dados.nome_indice,
                mensagem='Os parâmetros da pesquisa são inválidos.',
                detalhe=detalhe if config.debug else None
            ) from erro


    async def _executar_pesquisa(
        self,
        dados: PesquisaRequest
    ) -> ResultadoPesquisa:
        contexto = ContextoPesquisa(
            client=self._client,
            nome_indice=dados.nome_indice
        )

        configuracao_hibrida = ConfiguracaoPesquisaHibrida(
            boost_literal=dados.configuracao_hibrida.boost_literal,
            boost_vetorial=dados.configuracao_hibrida.boost_vetorial,
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
