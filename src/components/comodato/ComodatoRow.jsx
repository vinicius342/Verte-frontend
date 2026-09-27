import { formatDate } from "../../utils/formatDate";

export default function ComodatoRow({ comodato, onSelecionar }) {
  return (
    <li className="linha-cliente">
      <button type="button" className="linha-botao" onClick={() => onSelecionar(comodato)}>
        <span className="linha-pino" aria-hidden>
          📋
        </span>
        <span className="linha-texto">
          <span className="linha-nome">{comodato.razaoSocial || "Sem razão social"}</span>
          <span className="linha-comercio">Termo {comodato.numeroTermo || "—"}</span>
          {comodato.revenda ? <span className="linha-endereco">{comodato.revenda}</span> : null}
        </span>
        <span className="linha-seta" aria-hidden>
          →
        </span>
      </button>
    </li>
  );
}