class DivisorTexto:
    @classmethod
    def dividir(
        cls,
        conteudo: str,
        tamanho: int,
        sobreposicao: int = 0,
    ) -> list[str]:
        """Divide um texto em trechos, preservando palavras quando possível."""
        texto = conteudo.strip()
        if not texto:
            return []

        cls._validar_parametros(tamanho, sobreposicao)

        trechos: list[str] = []
        inicio = 0

        while inicio < len(texto):
            fim = cls._calcular_fim(texto, inicio, tamanho)
            trecho = texto[inicio:fim].strip()
            if trecho:
                trechos.append(trecho)

            if fim >= len(texto):
                break

            inicio = cls._calcular_proximo_inicio(
                texto,
                inicio,
                fim,
                sobreposicao,
            )

        return trechos

    @staticmethod
    def _validar_parametros(tamanho: int, sobreposicao: int) -> None:
        if tamanho <= 0:
            raise ValueError('O tamanho do trecho deve ser maior que zero.')
        if sobreposicao < 0 or sobreposicao >= tamanho:
            raise ValueError(
                'A sobreposição deve ser maior ou igual a zero e menor que o trecho.'
            )

    @classmethod
    def _calcular_fim(
        cls,
        texto: str,
        inicio: int,
        tamanho: int,
    ) -> int:
        fim = min(inicio + tamanho, len(texto))
        if fim == len(texto):
            return fim

        limite_palavra = cls._recuar_ate_separador(texto, fim, inicio)
        return limite_palavra - 1 if limite_palavra > inicio else fim

    @classmethod
    def _calcular_proximo_inicio(
        cls,
        texto: str,
        inicio_atual: int,
        fim_atual: int,
        sobreposicao: int,
    ) -> int:
        proximo_inicio = fim_atual

        if sobreposicao:
            candidato = fim_atual - sobreposicao
            limite_palavra = cls._recuar_ate_separador(
                texto,
                candidato,
                inicio_atual,
            )
            if limite_palavra > inicio_atual:
                proximo_inicio = limite_palavra

        proximo_inicio = cls._avancar_apos_espacos(texto, proximo_inicio)
        if proximo_inicio <= inicio_atual:
            return fim_atual
        return proximo_inicio

    @staticmethod
    def _recuar_ate_separador(
        texto: str,
        posicao: int,
        limite: int,
    ) -> int:
        while posicao > limite and not texto[posicao - 1].isspace():
            posicao -= 1
        return posicao

    @staticmethod
    def _avancar_apos_espacos(texto: str, posicao: int) -> int:
        while posicao < len(texto) and texto[posicao].isspace():
            posicao += 1
        return posicao
