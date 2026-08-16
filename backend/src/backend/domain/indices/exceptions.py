class IndiceError(Exception):
    '''
    Índice base para tratativa de erros de Índices.
    '''


class IndiceExistenteError(IndiceError):
    def __init__(self, nome_indice: str):
        super().__init__(
            f'Índice já existente: {nome_indice}'
        )


class IndiceNaoEncontradoError(IndiceError):
    def __init__(self, nome_indice: str):
        super().__init__(
            f'Índice não encontrado: {nome_indice}.'
        )


class ConfiguracaoInvalidaError(IndiceError):
    def __init__(self, nome_indice: str):
        super().__init__(
            f'Configuração de índice inválida: {nome_indice}.'
        )

