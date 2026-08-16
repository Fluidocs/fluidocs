from backend.config.singleton.modelo_embedding import ModeloEmbeddings
from typing import Union, List

class ServicoEmbeddings:
    @classmethod
    def _modelo(cls):
        return ModeloEmbeddings.get()

    @classmethod
    def gerar_embeddings(cls, texto: Union[str, List[str]], tamanho_lote: int = 32, pesquisa:bool = True) -> List[float]:
        prefixo: str = 'query: ' if pesquisa else 'passage: '

        texto_com_prefixo = ''
        if isinstance(texto, str):
            texto_com_prefixo = f'{prefixo}{texto}'
        else:
            texto_com_prefixo = [f'{prefixo}{t}' for t in texto]

        return cls._modelo().encode(
            texto_com_prefixo, 
            batch_size=tamanho_lote, 
            show_progress_bar=False,
            normalize_embeddings=True
        )
