from .base_strategy import StrategyExtracaoBase
from .extracao_factory import FactoryExtracao

import cv2, pytesseract
import numpy as np

@FactoryExtracao.registrar('png', 'jpg', 'jpeg')
class StrategyExtracaoImg(StrategyExtracaoBase):
    @classmethod
    def extrair_conteudo(cls, caminho: str) -> str:
        image = cls.processar_caso_geral(caminho)
        custom_config = r'--psm 3 --oem 3'
        return pytesseract.image_to_string(image, lang='por', config=custom_config)

    
    @classmethod
    def processar_caso_geral(cls, caminho: str):
        # 1. Carregamento da Imagem
        img = cv2.imread(caminho)
        
        # 2. Correção de Iluminação (CLAHE)
        # Transforma fotos com sombras em algo plano
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        gray = clahe.apply(gray)
        
        # 3. Deskewing (Correção de Inclinação)
        coords = np.column_stack(np.where(gray > 0))
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45: angle = -(90 + angle)
        else: angle = -angle
        
        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        gray = cv2.warpAffine(gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        # 4. Thresholding Adaptativo Híbrido
        binary = cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        return binary