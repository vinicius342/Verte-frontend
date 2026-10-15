// AtivoRow.jsx
export default function AtivoRow({ ativo, onSelecionar }) {
  return (
    <li className="linha-cliente">
      <button type="button" className="linha-botao" onClick={() => onSelecionar(ativo)}>
        <span className="linha-pino" aria-hidden>
          📦
        </span>
        <span className="linha-texto">
          <span className="linha-nome">
            <span className="mono">{ativo.codigo}</span> · {ativo.material}
          </span>
          <span className="linha-comercio">{ativo.tipo}</span>
        </span>
        <span className="linha-seta" aria-hidden>
          →
        </span>
      </button>
    </li>
  );
}