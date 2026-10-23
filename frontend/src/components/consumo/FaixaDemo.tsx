import './FaixaDemo.css';

export function FaixaDemo({ noCard = false }: { noCard?: boolean }) {
  return <span className={`faixa-demo${noCard ? ' faixa-demo-card' : ''}`}>
    <span className="faixa-demo-texto">demo</span>
  </span>;
}
