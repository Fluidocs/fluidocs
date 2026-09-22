import { ChevronDown, FileText } from 'lucide-react';
import type { DocumentoDemo } from '../../services/consumoDemo';

export function EvidenciaDocumento({ documento, numero, exibirAvisoExemplo = true }: { documento: DocumentoDemo; numero?: number; exibirAvisoExemplo?: boolean }) {
  return <details className="consumo-evidencia">
    <summary><FileText size={18} aria-hidden="true" /><span>{numero ? `[${numero}] ` : ''}{documento.nome}<small>Fonte: {documento.fonteNome}{exibirAvisoExemplo && ' · Texto de exemplo'}</small></span><span className="consumo-evidencia-acao">Ver trecho</span><ChevronDown className="consumo-evidencia-seta" size={18} aria-hidden="true" /></summary>
    <div className="consumo-trecho"><h4>{documento.titulo}</h4><blockquote>{documento.trecho}</blockquote>{exibirAvisoExemplo && <p>Conteúdo fictício desta demonstração; não corresponde a um arquivo enviado.</p>}</div>
  </details>;
}
