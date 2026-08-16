from sentence_transformers import SentenceTransformer
from backend.config.configuracoes import config
from threading import Lock

class ModeloEmbeddings:
    _instancia: SentenceTransformer | None = None
    _lock = Lock()

    @classmethod
    def get(cls) -> SentenceTransformer:
        if cls._instancia is None:
            with cls._lock:
                if cls._instancia is None:
                    try:
                        modelo = SentenceTransformer(
                            config.hf_modelo,
                            local_files_only=True
                        )
                    except Exception:
                        modelo = SentenceTransformer(
                            config.hf_modelo,
                            local_files_only=False
                        )

                    cls._instancia = modelo
        return cls._instancia
