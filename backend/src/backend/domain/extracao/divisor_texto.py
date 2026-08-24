import re
from langchain_text_splitters import RecursiveCharacterTextSplitter


class DivisorTexto:
    _CABECALHO_MARKDOWN = re.compile(
        r'(?m)^[ \t]{0,3}#{1,6}'
        r'(?:[ \t]+(?P<titulo>.*?)(?:[ \t]+#+)?[ \t]*|[ \t]*)$'
    )
    _TAG_HTML = re.compile(
        r'</?[a-z][a-z0-9:-]*\b[^>]*?/?>',
        flags=re.IGNORECASE,
    )
    _TAG_HTML_ESTRUTURAL = re.compile(
        r'</?(?:address|article|aside|blockquote|br|div|footer|header|hr|'
        r'h[1-6]|li|main|nav|ol|p|pre|section|table|tbody|td|tfoot|th|'
        r'thead|tr|ul)\b',
        flags=re.IGNORECASE,
    )
    _SEPARADORES_TITULOS = tuple(
        rf'(?im:(?:^[ \t]{{0,3}}#{{{nivel}}}(?:[ \t]+|(?=\n|$))|'
        rf'<h{nivel}\b[^>]*>))'
        for nivel in range(1, 7)
    )
    _SEPARADORES = (
        *_SEPARADORES_TITULOS,
        r'(?<=[.!?])\s+',
        r'\n{2,}',
        r'\n',
        r'[ \t]+',
        '',
    )

    @classmethod
    def dividir(
        cls,
        conteudo: str,
        tamanho: int,
        sobreposicao: int = 0,
    ) -> list[str]:
        """Divide o conteúdo priorizando sua estrutura semântica."""
        texto = cls._normalizar(conteudo)
        if not texto:
            return []

        cls._validar_parametros(tamanho, sobreposicao)
        separador = cls._criar_separador(tamanho, sobreposicao)
        trechos = separador.split_text(texto)

        return cls._limpar_trechos(trechos)

    @classmethod
    def _limpar_trechos(cls, trechos: list[str]) -> list[str]:
        trechos_limpos = []

        for trecho in trechos:
            trecho_limpo = cls._limpar_trecho(trecho)
            if trecho_limpo:
                trechos_limpos.append(trecho_limpo)

        return trechos_limpos

    @classmethod
    def _limpar_trecho(cls, trecho: str) -> str:
        sem_markdown = cls._CABECALHO_MARKDOWN.sub(
            lambda resultado: resultado.group('titulo') or '',
            trecho,
        )
        sem_tags_html = cls._TAG_HTML.sub(
            cls._substituir_tag_html,
            sem_markdown,
        )
        return cls._limpar_formatacao_residual(sem_tags_html)

    @classmethod
    def _substituir_tag_html(cls, resultado: re.Match[str]) -> str:
        if cls._TAG_HTML_ESTRUTURAL.match(resultado.group()):
            return '\n'
        return ''

    @staticmethod
    def _limpar_formatacao_residual(texto: str) -> str:
        sem_negrito_markdown = texto.replace('**', '')
        sem_quebras_e_tabulacoes = re.sub(
            r'[\n\t]+',
            ' ',
            sem_negrito_markdown,
        )
        return re.sub(r' {2,}', ' ', sem_quebras_e_tabulacoes).strip()

    @classmethod
    def _criar_separador(
        cls,
        tamanho: int,
        sobreposicao: int,
    ) -> RecursiveCharacterTextSplitter:
        return RecursiveCharacterTextSplitter(
            chunk_size=tamanho,
            chunk_overlap=sobreposicao,
            length_function=len,
            separators=list(cls._SEPARADORES),
            is_separator_regex=True,
            keep_separator='start',
        )

    @staticmethod
    def _normalizar(conteudo: str) -> str:
        return (
            conteudo
            .replace('\r\n', '\n')
            .replace('\r', '\n')
            .replace('\x00', '')
            .strip()
        )

    @staticmethod
    def _validar_parametros(tamanho: int, sobreposicao: int) -> None:
        if tamanho <= 0:
            raise ValueError('O tamanho do trecho deve ser maior que zero.')
        if sobreposicao < 0 or sobreposicao >= tamanho:
            raise ValueError(
                'A sobreposição deve ser maior ou igual a zero e menor que o trecho.'
            )
