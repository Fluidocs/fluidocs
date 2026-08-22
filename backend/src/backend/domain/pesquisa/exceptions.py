class PesquisaError(Exception):
    '''Exception base para pesquisa'''


class PesquisaInvalidaError(PesquisaError):
    def __init__(
        self, 
        nome_indice: str,
        mensagem: str = 'Não foi possível realizar a pesquisa.',
        detalhe: str | None = None 
    ):
        self.nome_indice = nome_indice
        self.detalhe = detalhe

        super().__init__(mensagem)
