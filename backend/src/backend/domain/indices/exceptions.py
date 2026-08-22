class IndiceError(Exception):
    '''
    Índice base para tratativa de erros de Índices.
    '''
    def __init__(
        self, 
        mensagem: str, 
        nome_indice: str
    ):
        self.nome_indice = nome_indice
        super().__init__(mensagem)


class IndiceExistenteError(IndiceError):
    def __init__(self, nome_indice: str):
        super().__init__(
            mensagem=f'Índice já existente: {nome_indice}',
            nome_indice=nome_indice
        )


class IndiceNaoEncontradoError(IndiceError):
    def __init__(self, nome_indice: str):
        super().__init__(
            mensagem=f'Índice não encontrado: {nome_indice}.',
            nome_indice=nome_indice
        )


class ConfiguracaoInvalidaError(IndiceError):
    def __init__(self, nome_indice: str):
        super().__init__(
            mensagem=f'Configuração de índice inválida: {nome_indice}.',
            nome_indice=nome_indice
        )

