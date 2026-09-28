import { formatDate } from "../../utils/formatDate";

function formatarDataHora(valor) {
  if (!valor) return null;
  const data = typeof valor?.toDate === "function" ? valor.toDate() : valor;
  return formatDate(data, { hora: true }); // ajuste as opções conforme a assinatura real de formatDate
}

export default function ComodatoRow({ comodato, onSelecionar }) {
  const dataHora = formatarDataHora(comodato.createdAt);

  return (
    <li className="linha-cliente">
      <button type="button" className="linha-botao" onClick={() => onSelecionar(comodato)}>
        <span className="linha-pino" aria-hidden>
          📋
        </span>
        <span className="linha-texto">
          <span className="linha-nome">{comodato.razaoSocial || "Sem razão social"}</span>
          {dataHora ? <span className="linha-comercio">{dataHora}</span> : null}
        </span>
        <span className="linha-seta" aria-hidden>
          →
        </span>
      </button>
    </li>
  );
}