class ServicoTrechos:
    @staticmethod
    def dividir(
        conteudo: str,
        tamanho: int,
        sobreposicao: int = 0,
    ) -> list[str]:
        """Divide texto em trechos, preservando palavras sempre que possível."""
        texto = conteudo.strip()
        if not texto:
            return []

        if tamanho <= 0:
            raise ValueError('O tamanho do trecho deve ser maior que zero.')
        if sobreposicao < 0 or sobreposicao >= tamanho:
            raise ValueError(
                'A sobreposição deve ser maior ou igual a zero e menor que o trecho.'
            )

        trechos: list[str] = []
        inicio = 0

        while inicio < len(texto):
            fim = min(inicio + tamanho, len(texto))

            if fim < len(texto):
                limite = fim
                while limite > inicio and not texto[limite - 1].isspace():
                    limite -= 1
                if limite > inicio:
                    fim = limite - 1

            trecho = texto[inicio:fim].strip()
            if trecho:
                trechos.append(trecho)

            if fim >= len(texto):
                break

            proximo_inicio = fim
            candidato_sobreposicao = fim - sobreposicao
            if sobreposicao and candidato_sobreposicao > inicio:
                limite_palavra = candidato_sobreposicao
                while (
                    limite_palavra > inicio
                    and not texto[limite_palavra - 1].isspace()
                ):
                    limite_palavra -= 1
                if limite_palavra > inicio:
                    proximo_inicio = limite_palavra

            while (
                proximo_inicio < len(texto)
                and texto[proximo_inicio].isspace()
            ):
                proximo_inicio += 1

            inicio = proximo_inicio if proximo_inicio > inicio else fim

        return trechos
